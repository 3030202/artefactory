import { db } from './db.js';
import { canonicalSources } from './sources_catalog.js';

export class IngestionEngine {
  constructor() {
    this.isSyncing = false;
    this.lastSync = null;
    this.syncStats = {
      total_runs: 0,
      last_run_timestamp: null,
      last_harvested_counts: { prompts: 0, skills: 0, workflows: 0, mcp_servers: 0, rules: 0 }
    };
  }

  // Dynamic Ingestion Registry Catalog with rich harvesting definitions
  getIngestionRecipes() {
    return [
      // 1. Anthropic MCP Source -> Harvest MCP Servers & Protocol Skills
      {
        sourceId: 'src_mcp_spec',
        category: 'specs_protocols',
        artifacts: {
          mcp_servers: [
            {
              id: 'mcp_github_connector',
              name: 'github-connector',
              title: 'GitHub Repositories & PRs MCP Server',
              category: 'mcp_servers',
              description: 'Model Context Protocol server for searching code, managing issues, reading diffs, and orchestrating GitHub Actions.',
              transport: 'stdio',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github'],
              status: 'ONLINE',
              version: '1.2.0',
              tags: ['github', 'git', 'mcp', 'code-review'],
              tools: [
                { name: 'search_repositories', description: 'Search GitHub repos by query and language', parameters: { query: 'string' } },
                { name: 'get_file_contents', description: 'Fetch blob contents from a target branch/commit', parameters: { owner: 'string', repo: 'string', path: 'string' } },
                { name: 'create_issue', description: 'Create a tracked issue with labels and assignees', parameters: { owner: 'string', repo: 'string', title: 'string', body: 'string' } }
              ]
            },
            {
              id: 'mcp_puppeteer_crawler',
              name: 'puppeteer-crawler',
              title: 'Puppeteer Headless Browser MCP Server',
              category: 'mcp_servers',
              description: 'Automated web navigation, JavaScript rendering, screenshot capture, and DOM element extraction.',
              transport: 'stdio',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-puppeteer'],
              status: 'ONLINE',
              version: '1.1.0',
              tags: ['browser', 'scraping', 'dom', 'mcp', 'puppeteer'],
              tools: [
                { name: 'navigate', description: 'Open a target webpage and wait for network idle', parameters: { url: 'string' } },
                { name: 'take_screenshot', description: 'Capture viewport image as base64', parameters: { full_page: 'boolean?' } },
                { name: 'evaluate_script', description: 'Run JavaScript in browser context', parameters: { script: 'string' } }
              ]
            }
          ],
          skills: [
            {
              id: 'skl_mcp_sse_transport',
              name: 'mcp-sse-bridge',
              title: 'MCP Server-Sent Events (SSE) Client Bridge',
              category: 'skills',
              description: 'Manages asynchronous SSE stream connections, session handshakes, and JSON-RPC message multiplexing over HTTP/2.',
              tags: ['mcp', 'sse', 'streaming', 'protocol'],
              version: '1.2.0',
              entry_file: 'SKILL.md',
              tools_required: ['run_command'],
              content: `---\nname: mcp-sse-bridge\ndescription: Manages live Server-Sent Events (SSE) transports for distributed MCP servers.\n---\n\n# MCP SSE Client Bridge\n\n## Instructions\n1. Establish SSE endpoint connection \`GET /sse\` with authentication tokens.\n2. Ingest \`endpoint\` event to discover target POST RPC endpoint.\n3. Multiplex bidirectional JSON-RPC calls through established session token.\n`
            }
          ]
        }
      },

      // 2. DSPy Framework -> Harvest DSPy Signatures & Optimization Workflows
      {
        sourceId: 'src_dspy_framework',
        category: 'prompt_engineering',
        artifacts: {
          prompts: [
            {
              id: 'prm_dspy_mipro_optimizer',
              title: 'DSPy MIPROv2 Multi-Prompt Optimizer Signature',
              category: 'prompts',
              description: 'Mathematical instruction and demonstration optimization signature using Bayesian surrogate models.',
              tags: ['dspy', 'mipro', 'teleprompter', 'bayesian-opt'],
              model: 'claude-3-7-sonnet',
              temperature: 0.1,
              version: '2.0.0',
              variables: [
                { name: 'DATASET_SPLIT', defaultValue: 'train: 100, val: 50', description: 'Training examples' },
                { name: 'METRIC_NAME', defaultValue: 'semantic_accuracy_with_citation', description: 'Validation objective' }
              ],
              template: `class MultiHopReasoning(dspy.Signature):
    """Answer complex multi-step questions with explicit intermediate reasoning steps."""
    context = dspy.InputField(desc="Retrieved canonical documents")
    question = dspy.InputField(desc="User inquiry requiring multi-hop synthesis")
    thought_trajectory = dspy.OutputField(desc="Step-by-step logical deduction")
    synthesized_answer = dspy.OutputField(desc="Final definitive answer with exact references")`
            }
          ],
          workflows: [
            {
              id: 'wf_dspy_teleprompter_dag',
              title: 'DSPy Continuous Teleprompter Optimization DAG',
              category: 'workflows',
              description: 'Automated prompt tuning pipeline: Golden Dataset -> BootstrapFewShot -> Validation Loss Check -> Production Registry Deployment.',
              tags: ['dspy', 'optimization', 'ci-cd', 'pipeline'],
              version: '1.3.0',
              status: 'READY',
              nodes: [
                { id: 'dsp_1', type: 'dataset', label: 'Evaluation Golden Set (500)', refId: null, status: 'READY', x: 80, y: 150 },
                { id: 'dsp_2', type: 'code', label: 'DSPy MIPROv2 Compiler', refId: 'prm_dspy_mipro_optimizer', status: 'READY', x: 340, y: 80 },
                { id: 'dsp_3', type: 'test', label: 'Metric Loss Score > 0.92', refId: null, status: 'READY', x: 620, y: 150 },
                { id: 'dsp_4', type: 'prompt', label: 'Deploy Optimized Signature', refId: null, status: 'READY', x: 880, y: 150 }
              ],
              edges: [
                { from: 'dsp_1', to: 'dsp_2', label: 'Batch Feed' },
                { from: 'dsp_2', to: 'dsp_3', label: 'Generated Candidates' },
                { from: 'dsp_3', to: 'dsp_4', label: 'Target Met' }
              ]
            }
          ]
        }
      },

      // 3. LangGraph & AutoGen -> Harvest Stateful Multi-Agent DAGs & Protocols
      {
        sourceId: 'src_langgraph',
        category: 'orchestration',
        artifacts: {
          workflows: [
            {
              id: 'wf_langgraph_supervisor_dag',
              title: 'LangGraph Supervisor Multi-Agent Router DAG',
              category: 'workflows',
              description: 'Hierarchical multi-agent router delegating tasks to Researcher, Coder, and QA Tester agents with conditional state recovery.',
              tags: ['langgraph', 'supervisor', 'router', 'multi-agent'],
              version: '2.1.0',
              status: 'READY',
              nodes: [
                { id: 'lg_sup', type: 'prompt', label: 'Supervisor Router Agent', refId: 'prm_arch_spec', status: 'READY', x: 100, y: 150 },
                { id: 'lg_res', type: 'code', label: 'Deep Research Agent', refId: null, status: 'READY', x: 380, y: 70 },
                { id: 'lg_cod', type: 'code', label: 'Code Generator Agent', refId: null, status: 'READY', x: 380, y: 230 },
                { id: 'lg_rev', type: 'security', label: 'Reviewer & Invariant Check', refId: 'prm_code_reviewer', status: 'READY', x: 680, y: 150 }
              ],
              edges: [
                { from: 'lg_sup', to: 'lg_res', label: 'Need Information' },
                { from: 'lg_sup', to: 'lg_cod', label: 'Need Implementation' },
                { from: 'lg_res', to: 'lg_rev', label: 'Findings' },
                { from: 'lg_cod', to: 'lg_rev', label: 'Diff Payload' },
                { from: 'lg_rev', to: 'lg_sup', label: 'Feedback Loop (Cyclic)' }
              ]
            }
          ]
        }
      },

      // 4. OWASP GenAI & MITRE ATLAS -> Harvest Security Rules & Guardrails
      {
        sourceId: 'src_owasp_llm_top10',
        category: 'security_threats',
        artifacts: {
          rules: [
            {
              id: 'rul_owasp_llm01_defense',
              title: 'OWASP LLM01: Prompt Injection & Context Isolation Protocol',
              category: 'rules',
              description: 'Mandatory structural isolation of all user-supplied data streams and external RAG chunks to prevent system instruction hijacking.',
              target_file: 'AGENTS.md',
              priority: 'CRITICAL',
              version: '2.2.0',
              tags: ['owasp', 'injection-defense', 'context-boundary', 'security'],
              content: `# OWASP LLM01 Prompt Injection Mitigation Policy

1. **Explicit Boundary Encapsulation**: Untrusted input must be wrapped in parameterized XML blocks (\`<user_untrusted_input>\`).
2. **Instruction Separation**: System directives are parsed with immutable priority.
3. **No Unfiltered Tool Reflection**: Agent thoughts and tool calls must validate against strict JSON Schemas before execution.`
            },
            {
              id: 'rul_owasp_llm06_excessive_agency',
              title: 'OWASP LLM06: Excessive Agency & Blast-Radius Mitigation',
              category: 'rules',
              description: 'Hard invariants enforcing least privilege, confirmation gates for destructive actions, and isolated sandbox execution environments.',
              target_file: 'AGENTS.md',
              priority: 'CRITICAL',
              version: '2.0.0',
              tags: ['owasp', 'excessive-agency', 'least-privilege', 'safety'],
              content: `# OWASP LLM06 Excessive Agency Safeguards

1. **Least Privilege Tools**: Every MCP tool must declare minimal required scopes.
2. **Human Approval Threshold**: Broad deletions, file drops, or external API publishing require explicit operator confirmation.
3. **Audit Trail**: Every mutating tool execution must generate a persistent activity log.`
            }
          ]
        }
      },

      // 5. Awesome Prompts Dataset -> Harvest Structured Personas
      {
        sourceId: 'src_awesome_prompts',
        category: 'datasets_hubs',
        artifacts: {
          prompts: [
            {
              id: 'prm_awesome_lead_architect',
              title: 'Awesome Persona: Principal Cloud Solutions Architect',
              category: 'prompts',
              description: 'Senior enterprise architect persona producing ADRs, fault-tolerant cloud topologies, and cost-optimized microservice specs.',
              tags: ['persona', 'architecture', 'cloud', 'aws', 'gcp'],
              model: 'claude-3-7-sonnet / gemini-2.5-pro',
              temperature: 0.2,
              version: '1.5.0',
              variables: [
                { name: 'WORKLOAD_DESCRIPTION', defaultValue: 'High-throughput event streaming platform with 50k RPS', description: 'Target system requirements' }
              ],
              template: `Act as a Principal Cloud Solutions Architect with 20+ years of experience in distributed systems.
Design an end-to-end resilient architecture for:
{{WORKLOAD_DESCRIPTION}}

Your design must detail:
1. Trade-offs between Consistency and Availability (CAP theorem).
2. Service boundaries, async messaging (Kafka/PubSub), and database partitioning.
3. Observability, circuit breaking, and disaster recovery failover (RPO/RTO).`
            }
          ]
        }
      },

      // 6. Enterprise Integrations -> Harvest Telegram & n8n Skills
      {
        sourceId: 'src_telegram_n8n_integration',
        category: 'enterprise_integrations',
        artifacts: {
          skills: [
            {
              id: 'skl_telegram_n8n_dispatcher',
              name: 'telegram-n8n-dispatcher',
              title: 'Telegram Bot & n8n Webhook Dispatcher',
              category: 'skills',
              description: 'Publishes automated reports, telemetry alerts, and prompt eval summaries directly to Telegram channels via n8n webhooks.',
              tags: ['telegram', 'n8n', 'webhooks', 'publishing', 'enterprise'],
              version: '1.3.0',
              entry_file: 'SKILL.md',
              tools_required: ['run_command'],
              content: `---\nname: telegram-n8n-dispatcher\ndescription: Sends structured markdown notifications and alert digests to Telegram channels via webhook payloads.\n---\n\n# Telegram & n8n Enterprise Dispatcher\n\n## Instructions\n1. Format message payload with Telegram HTML or MarkdownV2 escaping.\n2. Trigger webhook POST with signature header verification.\n3. Return message ID and delivery status.\n`
            }
          ]
        }
      }
    ];
  }

  // Execute Dynamic Harvesting from a single source
  async syncSource(sourceId) {
    const source = db.getById('sources', sourceId) || canonicalSources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Source with ID "${sourceId}" not found`);
    }

    const recipes = this.getIngestionRecipes();
    const recipe = recipes.find(r => r.sourceId === sourceId);

    const logDetails = {
      sourceId,
      sourceTitle: source.title,
      created: { prompts: 0, skills: 0, workflows: 0, mcp_servers: 0, rules: 0 },
      updated: { prompts: 0, skills: 0, workflows: 0, mcp_servers: 0, rules: 0 }
    };

    if (recipe && recipe.artifacts) {
      for (const [collection, items] of Object.entries(recipe.artifacts)) {
        for (const item of items) {
          const existing = db.getById(collection, item.id);
          if (existing) {
            db.update(collection, item.id, {
              ...item,
              source_ref: source.id,
              auto_synced: true,
              last_synced_at: new Date().toISOString()
            });
            logDetails.updated[collection] = (logDetails.updated[collection] || 0) + 1;
          } else {
            db.create(collection, {
              ...item,
              source_ref: source.id,
              auto_synced: true,
              last_synced_at: new Date().toISOString()
            });
            logDetails.created[collection] = (logDetails.created[collection] || 0) + 1;
          }
        }
      }
    } else {
      // Auto-generate a baseline artifact for sources without explicit recipes
      const slug = source.id.replace('src_', '');
      const existing = db.getById('prompts', `prm_synced_${slug}`);
      if (!existing) {
        db.create('prompts', {
          id: `prm_synced_${slug}`,
          title: `${source.title} (Live Sync)`,
          description: `Auto-harvested canonical template for ${source.title}`,
          category: 'prompts',
          model: 'claude-3-7-sonnet',
          tags: [...(source.tags || []), 'auto-synced'],
          source_ref: source.id,
          auto_synced: true,
          template: `# Directives based on ${source.title}\n\nCanonical Source: ${source.url}\n\n${source.excerpt}`
        });
        logDetails.created.prompts++;
      }
    }

    // Update source sync timestamp
    db.update('sources', sourceId, { last_synced_at: new Date().toISOString() });
    db.logActivity('DYNAMIC_SYNC', 'sources', sourceId, source.title, logDetails);

    return logDetails;
  }

  // Execute Dynamic Harvesting across all registered sources
  async syncAll(options = {}) {
    this.isSyncing = true;
    const startTime = Date.now();
    const sources = db.getCollection('sources');
    const results = [];
    const totals = {
      sources_scanned: sources.length,
      prompts_created: 0,
      skills_created: 0,
      workflows_created: 0,
      mcp_created: 0,
      rules_created: 0,
      prompts_updated: 0,
      skills_updated: 0,
      workflows_updated: 0,
      mcp_updated: 0,
      rules_updated: 0,
      duration_ms: 0
    };

    const terminalLogs = [
      `[${new Date().toISOString()}] 🚀 Initiating Dynamic Ingestion Engine across ${sources.length} canonical sources...`
    ];

    for (const source of sources) {
      terminalLogs.push(`[SYNC] Connecting to source: ${source.title} [${source.category}]...`);
      try {
        const res = await this.syncSource(source.id);
        results.push(res);

        totals.prompts_created += res.created.prompts || 0;
        totals.skills_created += res.created.skills || 0;
        totals.workflows_created += res.created.workflows || 0;
        totals.mcp_created += res.created.mcp_servers || 0;
        totals.rules_created += res.created.rules || 0;

        totals.prompts_updated += res.updated.prompts || 0;
        totals.skills_updated += res.updated.skills || 0;
        totals.workflows_updated += res.updated.workflows || 0;
        totals.mcp_updated += res.updated.mcp_servers || 0;
        totals.rules_updated += res.updated.rules || 0;

        terminalLogs.push(`[OK] Harvested from ${source.id}: +${res.created.prompts + res.created.skills + res.created.workflows + res.created.mcp_servers + res.created.rules} new, ~${res.updated.prompts + res.updated.skills + res.updated.workflows + res.updated.mcp_servers + res.updated.rules} updated.`);
      } catch (err) {
        terminalLogs.push(`[WARN] Skipping ${source.id}: ${err.message}`);
      }
    }

    totals.duration_ms = Date.now() - startTime;
    terminalLogs.push(`[${new Date().toISOString()}] ✅ Dynamic Ingestion completed in ${totals.duration_ms}ms.`);

    this.isSyncing = false;
    this.lastSync = new Date().toISOString();
    this.syncStats.total_runs++;
    this.syncStats.last_run_timestamp = this.lastSync;
    this.syncStats.last_harvested_counts = {
      prompts: totals.prompts_created,
      skills: totals.skills_created,
      workflows: totals.workflows_created,
      mcp_servers: totals.mcp_created,
      rules: totals.rules_created
    };

    return {
      success: true,
      timestamp: this.lastSync,
      totals,
      logs: terminalLogs,
      results
    };
  }
}

export const ingestionEngine = new IngestionEngine();
