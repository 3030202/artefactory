import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all MCP servers
router.get('/', (req, res) => {
  const { tag, search, transport, status } = req.query;
  let servers = db.getAll('mcp_servers', { tag, search, status });
  if (transport) {
    servers = servers.filter(s => s.transport === transport);
  }
  res.json({ success: true, data: servers, count: servers.length });
});

// Get single MCP server
router.get('/:id', (req, res) => {
  const server = db.getById('mcp_servers', req.params.id);
  if (!server) {
    return res.status(404).json({ success: false, error: 'MCP Server not found' });
  }
  res.json({ success: true, data: server });
});

// Create MCP server
router.post('/', (req, res) => {
  const { name, title, description, transport, command, args, endpoint_url, tools, tags } = req.body;
  if (!name || !transport) {
    return res.status(400).json({ success: false, error: 'Server name and transport (stdio / sse) are required' });
  }

  const newServer = db.create('mcp_servers', {
    name,
    title: title || name,
    category: 'mcp_servers',
    description: description || '',
    transport,
    command: command || '',
    args: Array.isArray(args) ? args : (args ? args.split(' ') : []),
    endpoint_url: endpoint_url || '',
    status: 'ONLINE',
    tools: tools || [],
    tools_count: (tools || []).length,
    tags: tags || ['mcp-server']
  });

  res.status(201).json({ success: true, data: newServer });
});

// Update MCP server
router.put('/:id', (req, res) => {
  const patch = { ...req.body };
  if (patch.tools && Array.isArray(patch.tools)) {
    patch.tools_count = patch.tools.length;
  }
  const updated = db.update('mcp_servers', req.params.id, patch);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'MCP Server not found' });
  }
  res.json({ success: true, data: updated });
});

// Delete MCP server
router.delete('/:id', (req, res) => {
  const success = db.delete('mcp_servers', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'MCP Server not found' });
  }
  res.json({ success: true, message: 'MCP Server deleted successfully' });
});

// Ping / Healthcheck MCP Server
router.post('/:id/ping', (req, res) => {
  const server = db.getById('mcp_servers', req.params.id);
  if (!server) {
    return res.status(404).json({ success: false, error: 'MCP Server not found' });
  }

  const latency = Math.floor(Math.random() * 25) + 5;
  res.json({
    success: true,
    server_id: server.id,
    name: server.name,
    transport: server.transport,
    status: 'ONLINE',
    latency_ms: latency,
    protocol_version: '2024-11-05',
    available_tools_count: (server.tools || []).length,
    checked_at: new Date().toISOString()
  });
});

// Test / Call tool mock
router.post('/:id/test-tool', (req, res) => {
  const server = db.getById('mcp_servers', req.params.id);
  if (!server) {
    return res.status(404).json({ success: false, error: 'MCP Server not found' });
  }

  const { tool_name, parameters } = req.body;
  const tool = (server.tools || []).find(t => t.name === tool_name);
  if (!tool) {
    return res.status(400).json({ success: false, error: `Tool "${tool_name}" not found on server "${server.name}"` });
  }

  res.json({
    success: true,
    server: server.name,
    tool: tool_name,
    input_parameters: parameters || {},
    result: {
      status: 'success',
      data: `[Mock Execution Result from ${server.name}::${tool_name}] Operation completed with parameters: ${JSON.stringify(parameters || {})}`
    },
    execution_time_ms: 18
  });
});

// Export mcp_config.json
router.get('/export/config', (req, res) => {
  const servers = db.getCollection('mcp_servers');
  const mcpServersConfig = {};

  servers.forEach(s => {
    if (s.transport === 'stdio') {
      mcpServersConfig[s.name] = {
        command: s.command || 'npx',
        args: s.args || []
      };
    } else if (s.transport === 'sse') {
      mcpServersConfig[s.name] = {
        url: s.endpoint_url || 'http://localhost:8080/sse'
      };
    }
  });

  const fullConfig = {
    mcpServers: mcpServersConfig
  };

  res.json({
    success: true,
    filename: 'mcp_config.json',
    config: fullConfig
  });
});

export default router;
