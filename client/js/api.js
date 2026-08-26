import { Toast } from './components/toast.js';

const API_BASE = '/api';

export const api = {
  async request(endpoint, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${endpoint}]:`, err);
      Toast.error(err.message || 'Network request failed');
      throw err;
    }
  },

  // System & Stats
  getStats() { return this.request('/system/stats'); },
  getState() { return this.request('/system/state'); },
  updateState(patch) { return this.request('/system/state', { method: 'POST', body: JSON.stringify(patch) }); },
  resetSeed() { return this.request('/system/reset-seed', { method: 'POST' }); },
  exportBundle() { return this.request('/system/export-bundle'); },

  // Omni Search
  omniSearch(query, category = 'all') {
    return this.request(`/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
  },

  // Prompts
  getPrompts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/prompts?${q}`);
  },
  getPrompt(id) { return this.request(`/prompts/${id}`); },
  createPrompt(data) { return this.request('/prompts', { method: 'POST', body: JSON.stringify(data) }); },
  updatePrompt(id, data) { return this.request(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deletePrompt(id) { return this.request(`/prompts/${id}`, { method: 'DELETE' }); },
  testPrompt(id, variables = {}) { return this.request(`/prompts/${id}/test`, { method: 'POST', body: JSON.stringify({ variables }) }); },
  getPromptHistory(id) { return this.request(`/prompts/${id}/history`); },

  // Skills
  getSkills(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/skills?${q}`);
  },
  getSkill(id) { return this.request(`/skills/${id}`); },
  createSkill(data) { return this.request('/skills', { method: 'POST', body: JSON.stringify(data) }); },
  updateSkill(id, data) { return this.request(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteSkill(id) { return this.request(`/skills/${id}`, { method: 'DELETE' }); },
  validateSkill(content) { return this.request('/skills/validate', { method: 'POST', body: JSON.stringify({ content }) }); },
  exportSkill(id) { return this.request(`/skills/${id}/export`); },

  // Workflows
  getWorkflows(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workflows?${q}`);
  },
  getWorkflow(id) { return this.request(`/workflows/${id}`); },
  createWorkflow(data) { return this.request('/workflows', { method: 'POST', body: JSON.stringify(data) }); },
  updateWorkflow(id, data) { return this.request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteWorkflow(id) { return this.request(`/workflows/${id}`, { method: 'DELETE' }); },
  simulateWorkflow(id) { return this.request(`/workflows/${id}/simulate`, { method: 'POST' }); },

  // MCP Servers
  getMcpServers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/mcp?${q}`);
  },
  getMcpServer(id) { return this.request(`/mcp/${id}`); },
  createMcpServer(data) { return this.request('/mcp', { method: 'POST', body: JSON.stringify(data) }); },
  updateMcpServer(id, data) { return this.request(`/mcp/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteMcpServer(id) { return this.request(`/mcp/${id}`, { method: 'DELETE' }); },
  pingMcpServer(id) { return this.request(`/mcp/${id}/ping`, { method: 'POST' }); },
  testMcpTool(id, tool_name, parameters) { return this.request(`/mcp/${id}/test-tool`, { method: 'POST', body: JSON.stringify({ tool_name, parameters }) }); },
  exportMcpConfig() { return this.request('/mcp/export/config'); },

  // Rules
  getRules(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/rules?${q}`);
  },
  getRule(id) { return this.request(`/rules/${id}`); },
  createRule(data) { return this.request('/rules', { method: 'POST', body: JSON.stringify(data) }); },
  updateRule(id, data) { return this.request(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteRule(id) { return this.request(`/rules/${id}`, { method: 'DELETE' }); },
  compileRules() { return this.request('/rules/compile/system-prompt'); },

  // Sources & Knowledge Hub
  getSources(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/sources?${q}`);
  },
  getSource(id) { return this.request(`/sources/${id}`); },
  createSource(data) { return this.request('/sources', { method: 'POST', body: JSON.stringify(data) }); },
  updateSource(id, data) { return this.request(`/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteSource(id) { return this.request(`/sources/${id}`, { method: 'DELETE' }); },
  convertSource(id, targetType) { return this.request(`/sources/${id}/convert`, { method: 'POST', body: JSON.stringify({ targetType }) }); }
};

