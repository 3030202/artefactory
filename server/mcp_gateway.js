import crypto from 'node:crypto';
import { db } from './db.js';
import { semanticSearchEngine } from './semantic_search.js';
import { ingestionEngine } from './ingestion_engine.js';
import { GitOpsSerializer } from './gitops_serializer.js';

export class MCPGateway {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> { res, createdAt, clientInfo }
  }

  // Handle SSE handshake: GET /mcp/sse
  handleSSEConnection(req, res) {
    const sessionId = crypto.randomUUID();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`event: endpoint\ndata: /mcp/messages?sessionId=${sessionId}\n\n`);

    this.activeSessions.set(sessionId, {
      res,
      createdAt: new Date().toISOString(),
      clientInfo: req.headers['user-agent'] || 'Unknown MCP Client'
    });

    console.log(`[MCP Gateway] Client connected. Session: ${sessionId}`);

    // Keep-alive heartbeat
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.activeSessions.delete(sessionId);
      console.log(`[MCP Gateway] Client disconnected. Session: ${sessionId}`);
    });
  }

  // Handle JSON-RPC 2.0 messages: POST /mcp/messages?sessionId=...
  async handleMessage(req, res) {
    const { sessionId } = req.query;
    const body = req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null });
    }

    const { id, method, params } = body;
    console.log(`[MCP Gateway] Request [${method}] id=${id}`);

    try {
      let result = null;

      switch (method) {
        // 1. Initialize
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'artefactory-control-tower',
              version: '2.0.0-prod',
              description: 'AI Artifacts Control Tower: Prompts, Skills, DAG Workflows, MCP Servers, and Guardrails Gateway.'
            },
            capabilities: {
              tools: { listChanged: true },
              prompts: { listChanged: true },
              resources: { subscribe: true, listChanged: true }
            }
          };
          break;

        case 'notifications/initialized':
          return res.status(200).send('OK');

        // 2. Tools List
        case 'tools/list':
          result = {
            tools: [
              {
                name: 'search_artifacts',
                description: 'Search across all artifact registries (prompts, skills, workflows, MCP servers, rules) with semantic vector relevance.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search keywords or natural language inquiry' },
                    category: { type: 'string', enum: ['all', 'prompts', 'skills', 'workflows', 'mcp_servers', 'rules', 'sources'], default: 'all' },
                    semantic: { type: 'boolean', description: 'Enable vector semantic similarity', default: true },
                    limit: { type: 'number', default: 5 }
                  },
                  required: ['query']
                }
              },
              {
                name: 'get_prompt',
                description: 'Retrieve a canonical prompt template by ID, with optional variable interpolation.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Prompt ID (e.g., prm_anthropic_system_metaprompt, prm_arch_spec)' },
                    variables: { type: 'object', description: 'Key-value map for {{var}} placeholders', default: {} }
                  },
                  required: ['id']
                }
              },
              {
                name: 'list_prompts',
                description: 'List all available prompt templates in the registry with token estimates and models.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    tag: { type: 'string', description: 'Filter by tag (e.g. anthropic, dspy, security)' }
                  }
                }
              },
              {
                name: 'get_skill',
                description: 'Fetch complete SKILL.md definition and YAML frontmatter for an agent skill.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Skill name (e.g. mcp-sse-bridge, langgraph-agent-builder)' }
                  },
                  required: ['name']
                }
              },
              {
                name: 'get_system_rules',
                description: 'Compile and retrieve the global AGENTS.md system safety directives and invariants.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    priority: { type: 'string', enum: ['ALL', 'CRITICAL', 'HIGH'], default: 'ALL' }
                  }
                }
              },
              {
                name: 'sync_from_sources',
                description: 'Trigger real-time dynamic harvesting from canonical upstream specifications.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    sourceId: { type: 'string', description: 'Specific source ID or empty for all' }
                  }
                }
              }
            ]
          };
          break;

        // 3. Tools Call
        case 'tools/call':
          result = await this.executeToolCall(params?.name, params?.arguments || {});
          break;

        // 4. Prompts List
        case 'prompts/list':
          const prompts = db.getCollection('prompts');
          result = {
            prompts: prompts.map(p => ({
              name: p.id,
              description: p.description,
              arguments: (p.variables || []).map(v => ({
                name: v.name,
                description: v.description || v.defaultValue || '',
                required: false
              }))
            }))
          };
          break;

        // 5. Prompts Get
        case 'prompts/get':
          const pId = params?.name || params?.id;
          const p = db.getById('prompts', pId);
          if (!p) throw new Error(`Prompt ${pId} not found`);

          let filled = p.template || '';
          const pArgs = params?.arguments || {};
          for (const [k, v] of Object.entries(pArgs)) {
            filled = filled.replaceAll(`{{${k}}}`, String(v));
          }

          result = {
            description: p.description,
            messages: [
              {
                role: 'user',
                content: { type: 'text', text: filled }
              }
            ]
          };
          break;

        // 6. Resources List
        case 'resources/list':
          result = {
            resources: [
              { uri: 'artefactory://rules/AGENTS.md', name: 'Compiled AGENTS.md Directives', mimeType: 'text/markdown' },
              { uri: 'artefactory://manifest.json', name: 'Artifacts Integrity Manifest', mimeType: 'application/json' },
              { uri: 'artefactory://mcp/mcp_config.json', name: 'Aggregated MCP Server Configurations', mimeType: 'application/json' }
            ]
          };
          break;

        // 7. Resources Read
        case 'resources/read':
          const uri = params?.uri || '';
          if (uri === 'artefactory://rules/AGENTS.md') {
            const rules = db.getCollection('rules');
            result = { contents: [{ uri, mimeType: 'text/markdown', text: GitOpsSerializer.serializeRules(rules) }] };
          } else if (uri === 'artefactory://manifest.json') {
            result = { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(GitOpsSerializer.generateManifest(db), null, 2) }] };
          } else if (uri === 'artefactory://mcp/mcp_config.json') {
            const mcp = db.getCollection('mcp_servers');
            result = { contents: [{ uri, mimeType: 'application/json', text: GitOpsSerializer.serializeMcpConfig(mcp) }] };
          } else {
            throw new Error(`Resource ${uri} not found`);
          }
          break;

        default:
          return res.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method '${method}' not found` },
            id
          });
      }

      // If session exists, broadcast event
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.res.write(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', result, id })}\n\n`);
      }

      res.json({ jsonrpc: '2.0', result, id });
    } catch (err) {
      console.error(`[MCP Gateway Error] ${err.message}`);
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: err.message },
        id
      });
    }
  }

  // Tool execution logic
  async executeToolCall(toolName, args) {
    switch (toolName) {
      case 'search_artifacts': {
        const { query, category = 'all', semantic = true, limit = 5 } = args;
        let matches = [];
        if (semantic) {
          matches = semanticSearchEngine.search(query, { category, limit });
        } else {
          matches = db.omniSearch(query, category).slice(0, limit);
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: matches.length, results: matches }, null, 2)
            }
          ]
        };
      }

      case 'get_prompt': {
        const { id, variables = {} } = args;
        const prompt = db.getById('prompts', id);
        if (!prompt) throw new Error(`Prompt '${id}' not found`);

        let rendered = prompt.template || '';
        for (const [k, v] of Object.entries(variables)) {
          rendered = rendered.replaceAll(`{{${k}}}`, String(v));
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: prompt.id,
                title: prompt.title,
                model: prompt.model,
                temperature: prompt.temperature,
                rendered_template: rendered,
                tokens_est: Math.ceil(rendered.length / 4)
              }, null, 2)
            }
          ]
        };
      }

      case 'list_prompts': {
        const { tag } = args;
        let list = db.getCollection('prompts');
        if (tag) list = list.filter(p => (p.tags || []).includes(tag));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(list.map(p => ({
                id: p.id,
                title: p.title,
                model: p.model,
                tags: p.tags,
                tokens: Math.ceil((p.template || '').length / 4)
              })), null, 2)
            }
          ]
        };
      }

      case 'get_skill': {
        const { name } = args;
        const skill = db.getCollection('skills').find(s => s.name === name || s.id === name);
        if (!skill) throw new Error(`Skill '${name}' not found`);
        return {
          content: [
            {
              type: 'text',
              text: GitOpsSerializer.serializeSkill(skill)
            }
          ]
        };
      }

      case 'get_system_rules': {
        const { priority = 'ALL' } = args;
        let rules = db.getCollection('rules');
        if (priority !== 'ALL') rules = rules.filter(r => r.priority === priority);
        return {
          content: [
            {
              type: 'text',
              text: GitOpsSerializer.serializeRules(rules)
            }
          ]
        };
      }

      case 'sync_from_sources': {
        const { sourceId } = args;
        let report;
        if (sourceId) {
          report = await ingestionEngine.syncSource(sourceId);
        } else {
          report = await ingestionEngine.syncAll({ trigger: 'mcp_tool_call' });
        }
        return {
          content: [
            {
              type: 'text',
              text: `Harvest completed successfully: ${JSON.stringify(report.totals || report, null, 2)}`
            }
          ]
        };
      }

      default:
        throw new Error(`Tool '${toolName}' is not implemented.`);
    }
  }
}

export const mcpGateway = new MCPGateway();
