import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { renderEmptyState } from '../components/emptyState.js';
import { McpInspector } from '../components/mcpInspector.js';

export const mcpView = {
  servers: [],
  selectedTransport: 'all',
  searchQuery: '',

  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading MCP Servers Registry...</div>`;
    await this.loadServers(container);
  },

  async loadServers(container) {
    try {
      const res = await api.getMcpServers();
      this.servers = res.data || [];
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load MCP servers: ${err.message}</div>`;
    }
  },

  renderUI(container) {
    let filtered = this.servers;
    if (this.selectedTransport !== 'all') {
      filtered = filtered.filter(s => s.transport === this.selectedTransport);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.tools && s.tools.some(t => t.name.toLowerCase().includes(q))) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <span>🌐</span>
            <span>MCP Servers & Tools Registry</span>
            <span class="badge badge-mcp">${this.servers.length} Servers</span>
            <span class="badge badge-success" style="font-size: 11px;">● Continuous Live Stream</span>
          </div>
          <div class="section-desc">
            Постоянно обновляемый каталог серверов Model Context Protocol (@modelcontextprotocol/servers, GitHub, SQLite, Ollama, Puppeteer) с инспекцией JSON-RPC тулов и экспортом <code style="color: #22d3ee;">mcp_config.json</code>.
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-sync-mcp" title="Обновить MCP-серверы из источников">
            <span>🔄</span> Live Sync Feed
          </button>
          <button class="btn btn-secondary" id="btn-export-mcp-config">
            <span>⚙️</span> Export mcp_config.json
          </button>
          <button class="btn btn-secondary" id="btn-launch-mcp-inspector" style="background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.4); color: #22d3ee;">
            <span>🔬</span> Launch Inspector Sandbox
          </button>
          <button class="btn btn-primary" id="btn-create-mcp">
            <span>✨</span> Register MCP Server
          </button>
        </div>
      </div>

      <!-- Native Control Tower MCP Server Gateway Banner -->
      <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="font-size: 28px;">📡</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Native Control Tower MCP Gateway</span>
              <span class="badge badge-success">● SSE Transport Active</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
              Подключите Claude Desktop, Cursor или Antigravity к эндпоинту: <code style="color: #22d3ee; font-weight: 700;">${window.location.origin}/mcp/sse</code>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn btn-secondary btn-sm" id="btn-open-gateway-tester">
            <span>🔬</span> MCP Inspector Sandbox
          </button>
          <button class="btn btn-primary btn-sm" id="btn-copy-claude-config" style="background: var(--cat-mcp, #06b6d4);">
            <span>📋</span> Copy Claude / Cursor Config
          </button>
        </div>
      </div>

      <!-- Filters & Transport Selector -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon-inside">🔍</span>
          <input type="text" class="search-input" id="mcp-search" placeholder="Поиск серверов и тулов..." value="${this.searchQuery}">
        </div>
        <div class="tag-chips-container">
          <div class="tag-chip ${this.selectedTransport === 'all' ? 'active' : ''}" data-transport="all">All Transports</div>
          <div class="tag-chip ${this.selectedTransport === 'stdio' ? 'active' : ''}" data-transport="stdio">Stdio (CLI/Subprocess)</div>
          <div class="tag-chip ${this.selectedTransport === 'sse' ? 'active' : ''}" data-transport="sse">SSE (HTTP / Server-Sent Events)</div>
        </div>
      </div>

      <!-- Servers Grid -->
      <div class="cards-grid">
        ${filtered.length === 0 ? renderEmptyState('mcp_servers') : filtered.map(s => `
          <div class="artifact-card" data-id="${s.id}">
            <div class="card-header">
              <div>
                ${s.source_title ? `<div class="badge badge-sources" style="font-size: 9px; margin-bottom: 3px;">📡 ${s.source_title}</div>` : ''}
                <div class="card-title">${s.title || s.name}</div>
                <div style="font-family: var(--font-mono); font-size: 11px; color: #22d3ee; margin-top: 2px;">${s.name}</div>
              </div>
              <div class="flex-center gap-xs">
                <span class="badge badge-mcp">${(s.transport || 'stdio').toUpperCase()}</span>
                ${s.auto_synced ? `<span class="badge badge-success" style="font-size: 9px;">Live</span>` : ''}
              </div>
            </div>

            <div class="card-desc">${s.description || 'No description available.'}</div>

            <div class="card-metadata">
              <span>🟢 Status: ${s.status || 'ONLINE'}</span>
              <span>•</span>
              <span>🛠️ ${(s.tools || []).length} tools exposed</span>
              ${s.version ? `<span>• v${s.version}</span>` : ''}
            </div>

            <!-- Command or Endpoint snippet -->
            <div style="background: #050811; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 10px; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); overflow-x: auto; white-space: nowrap;">
              ${s.transport === 'stdio' 
                ? `<code>${s.command} ${(s.args || []).join(' ')}</code>`
                : `<code>${s.endpoint_url || 'http://localhost:8080/sse'}</code>`
              }
            </div>

            <div class="card-tags">
              ${(s.tools || []).map(tool => `<span class="badge" style="background: rgba(6, 182, 212, 0.1); color: #22d3ee; font-family: var(--font-mono); font-size: 10px;">${tool.name}</span>`).join('')}
            </div>

            <div class="card-footer">
              <button class="btn btn-primary btn-sm btn-open-tools-inspector" data-id="${s.id}" style="padding: 6px 12px; font-size: 12px;">
                <span>🛠️</span> Tools Inspector
              </button>
              <div class="card-actions">
                <button class="btn-icon btn-ping-server" data-id="${s.id}" title="Ping Healthcheck">📡</button>
                <button class="btn-icon btn-edit-server" data-id="${s.id}" title="Edit Server">✏️</button>
                <button class="btn-icon btn-delete-server" data-id="${s.id}" title="Delete" style="color: var(--status-danger);">🗑️</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Listeners
    container.querySelector('#btn-sync-mcp')?.addEventListener('click', async () => {
      Toast.info('Синхронизация MCP-серверов из канонических источников...');
      try {
        await api.syncSources();
        Toast.success('Реестр MCP-серверов успешно обновлен!');
        await this.loadServers(container);
        if (window.appRouter) window.appRouter.updateStatsCounters();
      } catch (err) {
        Toast.error(err.message || 'Ошибка синхронизации');
      }
    });

    const searchInput = container.querySelector('#mcp-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderUI(container);
      const input = container.querySelector('#mcp-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    container.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.selectedTransport = chip.getAttribute('data-transport');
        this.renderUI(container);
      });
    });

    container.querySelector('#btn-copy-claude-config')?.addEventListener('click', () => {
      const config = {
        mcpServers: {
          "artefactory-control-tower": {
            url: `${window.location.origin}/mcp/sse`
          }
        }
      };
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      Toast.success('Claude Desktop / Cursor config copied to clipboard!');
    });

    container.querySelector('#btn-open-gateway-tester')?.addEventListener('click', () => {
      McpInspector.openModal();
    });

    container.querySelector('#btn-launch-mcp-inspector')?.addEventListener('click', () => {
      McpInspector.openModal();
    });

    container.querySelector('#btn-create-mcp')?.addEventListener('click', () => {
      this.openEditModal(null, container);
    });

    container.querySelector('.btn-empty-primary')?.addEventListener('click', () => {
      this.openEditModal(null, container);
    });

    container.querySelector('.btn-empty-secondary')?.addEventListener('click', () => {
      McpInspector.openModal();
    });

    container.querySelector('#btn-export-mcp-config')?.addEventListener('click', async () => {
      const res = await api.exportMcpConfig();
      this.openConfigModal(res.config);
    });

    container.querySelectorAll('.btn-open-tools-inspector').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const server = this.servers.find(s => s.id === id);
        if (server) this.openInspectorModal(server);
      });
    });

    container.querySelectorAll('.btn-ping-server').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await api.pingMcpServer(id);
        Toast.success(`Ping response from ${res.name}: ${res.latency_ms}ms [Status: ${res.status}]`);
      });
    });

    container.querySelectorAll('.btn-edit-server').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const server = this.servers.find(s => s.id === id);
        if (server) this.openEditModal(server, container);
      });
    });

    container.querySelectorAll('.btn-delete-server').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this MCP server configuration?')) {
          await api.deleteMcpServer(id);
          Toast.success('MCP server deleted.');
          await this.loadServers(container);
        }
      });
    });
  },

  // Modal: Tools Inspector & Interactive Tool Tester
  openInspectorModal(server) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const tools = server.tools || [];

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-header">
          <div class="modal-title">
            <span>🛠️</span>
            <span>MCP Tools Inspector & Tester: <strong>${server.name}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="split-pane" style="height: 520px;">
            <!-- Left: Tools List -->
            <div class="editor-pane">
              <div class="pane-header">
                <span>Exposed MCP Tools (${tools.length})</span>
                <span class="badge badge-mcp">${server.transport.toUpperCase()}</span>
              </div>
              <div style="padding: 12px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px;">
                ${tools.map((t, idx) => `
                  <div class="artifact-card tool-select-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="cursor: pointer; padding: 12px;">
                    <div style="font-weight: 700; font-family: var(--font-mono); font-size: 13px; color: #22d3ee;">${t.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${t.description || ''}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Right: Interactive Tool Execution Tester -->
            <div class="preview-pane">
              <div class="pane-header">
                <span id="active-tool-name">Tool Parameters & Execution</span>
                <button class="btn btn-primary btn-sm" id="btn-execute-tool" style="padding: 4px 10px; font-size: 11px;">▶ Execute Call</button>
              </div>
              <div style="padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Input Parameters (JSON):</div>
                <textarea class="form-input" id="tool-params-input" rows="5" style="font-family: var(--font-mono); font-size: 12px;"></textarea>

                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Response Payload:</div>
                <pre id="tool-result-box" style="background: #050811; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; font-family: var(--font-mono); font-size: 11px; color: #38bdf8; overflow-x: auto; flex: 1; min-height: 140px;">// Execute tool to see MCP protocol response</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    let activeToolIdx = 0;
    const updateActiveTool = () => {
      const tool = tools[activeToolIdx];
      if (!tool) return;
      const title = backdrop.querySelector('#active-tool-name');
      const paramsInput = backdrop.querySelector('#tool-params-input');
      if (title) title.textContent = `Call: ${tool.name}()`;
      if (paramsInput) {
        paramsInput.value = JSON.stringify(tool.parameters || {}, null, 2);
      }
    };

    updateActiveTool();

    backdrop.querySelectorAll('.tool-select-item').forEach(item => {
      item.addEventListener('click', () => {
        backdrop.querySelectorAll('.tool-select-item').forEach(i => i.style.borderColor = 'var(--border-subtle)');
        item.style.borderColor = 'var(--cat-mcp)';
        activeToolIdx = Number(item.getAttribute('data-idx'));
        updateActiveTool();
      });
    });

    backdrop.querySelector('#btn-execute-tool')?.addEventListener('click', async () => {
      const tool = tools[activeToolIdx];
      if (!tool) return;
      let params = {};
      try {
        params = JSON.parse(backdrop.querySelector('#tool-params-input').value);
      } catch (err) {
        Toast.error('Invalid JSON in parameters');
        return;
      }

      const resBox = backdrop.querySelector('#tool-result-box');
      resBox.textContent = 'Calling MCP Tool...';

      try {
        const res = await api.testMcpTool(server.id, tool.name, params);
        resBox.textContent = JSON.stringify(res, null, 2);
        Toast.success(`Tool ${tool.name} executed successfully.`);
      } catch (err) {
        resBox.textContent = `Error: ${err.message}`;
      }
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Edit or Create MCP Server
  openEditModal(server, container) {
    const isEdit = Boolean(server);
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>${isEdit ? '✏️ Edit MCP Server' : '✨ Register MCP Server'}</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Server Identifier (Key) *</label>
              <input type="text" class="form-input" id="mcp-name" value="${isEdit ? server.name : ''}" placeholder="e.g. filesystem-server">
            </div>
            <div class="form-group">
              <label class="form-label">Display Title</label>
              <input type="text" class="form-input" id="mcp-title" value="${isEdit ? (server.title || server.name) : ''}" placeholder="e.g. Workspace Filesystem Server">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" id="mcp-desc" value="${isEdit ? (server.description || '') : ''}">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Transport Protocol *</label>
              <select class="form-select" id="mcp-transport">
                <option value="stdio" ${isEdit && server.transport === 'stdio' ? 'selected' : ''}>stdio (CLI Subprocess)</option>
                <option value="sse" ${isEdit && server.transport === 'sse' ? 'selected' : ''}>sse (HTTP Server-Sent Events)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Command (for stdio)</label>
              <input type="text" class="form-input" id="mcp-cmd" value="${isEdit ? (server.command || '') : 'npx'}" placeholder="e.g. npx or python3">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Arguments (space separated, for stdio)</label>
            <input type="text" class="form-input" id="mcp-args" value="${isEdit ? (server.args || []).join(' ') : '-y @modelcontextprotocol/server-filesystem .'}">
          </div>
          <div class="form-group">
            <label class="form-label">Endpoint URL (for SSE transport)</label>
            <input type="text" class="form-input" id="mcp-url" value="${isEdit ? (server.endpoint_url || '') : ''}" placeholder="http://localhost:8080/sse">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Cancel</button>
          <button class="btn btn-primary" id="btn-save-mcp">Save Server</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('#btn-save-mcp')?.addEventListener('click', async () => {
      const name = backdrop.querySelector('#mcp-name')?.value.trim();
      const title = backdrop.querySelector('#mcp-title')?.value.trim();
      const description = backdrop.querySelector('#mcp-desc')?.value.trim();
      const transport = backdrop.querySelector('#mcp-transport')?.value;
      const command = backdrop.querySelector('#mcp-cmd')?.value.trim();
      const args = backdrop.querySelector('#mcp-args')?.value.trim().split(' ').filter(Boolean);
      const endpoint_url = backdrop.querySelector('#mcp-url')?.value.trim();

      if (!name) {
        Toast.error('Server identifier is required.');
        return;
      }

      if (isEdit) {
        await api.updateMcpServer(server.id, {
          name,
          title,
          description,
          transport,
          command,
          args,
          endpoint_url
        });
        Toast.success('MCP server updated.');
      } else {
        await api.createMcpServer({
          name,
          title,
          description,
          transport,
          command,
          args,
          endpoint_url,
          tools: [
            { name: "ping", description: "Healthcheck probe", parameters: {} }
          ]
        });
        Toast.success('MCP server registered.');
      }

      backdrop.remove();
      await this.loadServers(container);
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Export mcp_config.json
  openConfigModal(config) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const formattedJson = JSON.stringify(config, null, 2);

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>⚙️</span>
            <span>Exported <strong>mcp_config.json</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
            Copy this configuration into your Agent / IDE settings (<code>~/.gemini/antigravity-ide/mcp_config.json</code> or Claude Code).
          </div>
          <textarea class="form-input" readonly rows="14" style="font-family: var(--font-mono); font-size: 12px; color: #22d3ee;">${formattedJson}</textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-copy-config">Copy JSON</button>
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelector('#btn-copy-config')?.addEventListener('click', () => {
      navigator.clipboard.writeText(formattedJson);
      Toast.success('mcp_config.json copied to clipboard!');
    });
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Native Gateway Tester
  openGatewayTesterModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>📡</span>
            <span>Native Control Tower MCP JSON-RPC Gateway Tester</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body">
          <div class="split-pane">
            <!-- Left: Tool & Parameters -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label class="form-label">Available Gateway Tool</label>
                <select class="form-select" id="gw-tool-name">
                  <option value="search_artifacts">search_artifacts (Semantic/Keyword)</option>
                  <option value="get_prompt">get_prompt (Retrieve template & tokens)</option>
                  <option value="list_prompts">list_prompts (Catalog)</option>
                  <option value="get_skill">get_skill (SKILL.md)</option>
                  <option value="get_system_rules">get_system_rules (AGENTS.md)</option>
                  <option value="sync_from_sources">sync_from_sources (Dynamic Harvest)</option>
                </select>
              </div>

              <div>
                <label class="form-label">Tool Arguments (JSON)</label>
                <textarea class="form-textarea" id="gw-tool-args" rows="6" style="font-family: var(--font-mono); font-size: 12px;">{\n  "query": "OWASP security injection",\n  "semantic": true,\n  "limit": 3\n}</textarea>
              </div>

              <div style="padding: 10px 14px; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: var(--radius-md); font-size: 11px; color: var(--text-secondary);">
                💡 Вызов выполняется по протоколу <code>JSON-RPC 2.0</code> через эндпоинт <code>POST /mcp/messages</code>.
              </div>
            </div>

            <!-- Right: JSON-RPC Response Output -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div class="pane-header">
                <span>Response Output</span>
                <span class="badge badge-mcp" id="gw-status-badge">Ready</span>
              </div>
              <pre id="gw-output" style="background: #050811; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-family: var(--font-mono); font-size: 11px; color: #34d399; height: 230px; overflow-y: auto; white-space: pre-wrap;">Нажмите "Execute Tool" для отправки запроса...</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Закрыть</button>
          <button class="btn btn-primary" id="btn-execute-gw-tool" style="background: var(--cat-mcp, #06b6d4);">
            <span>⚡</span> Execute Tool
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    const toolSelect = backdrop.querySelector('#gw-tool-name');
    const argsTextarea = backdrop.querySelector('#gw-tool-args');
    const outputBox = backdrop.querySelector('#gw-output');
    const statusBadge = backdrop.querySelector('#gw-status-badge');

    // Preset argument templates
    toolSelect.addEventListener('change', () => {
      const tool = toolSelect.value;
      if (tool === 'search_artifacts') {
        argsTextarea.value = JSON.stringify({ query: 'OWASP security injection', semantic: true, limit: 3 }, null, 2);
      } else if (tool === 'get_prompt') {
        argsTextarea.value = JSON.stringify({ id: 'prm_anthropic_system_metaprompt', variables: {} }, null, 2);
      } else if (tool === 'list_prompts') {
        argsTextarea.value = JSON.stringify({ tag: 'anthropic' }, null, 2);
      } else if (tool === 'get_skill') {
        argsTextarea.value = JSON.stringify({ name: 'mcp-sse-bridge' }, null, 2);
      } else if (tool === 'get_system_rules') {
        argsTextarea.value = JSON.stringify({ priority: 'ALL' }, null, 2);
      } else if (tool === 'sync_from_sources') {
        argsTextarea.value = JSON.stringify({ sourceId: 'src_mcp_spec' }, null, 2);
      }
    });

    backdrop.querySelector('#btn-execute-gw-tool')?.addEventListener('click', async () => {
      const toolName = toolSelect.value;
      let args = {};
      try {
        args = JSON.parse(argsTextarea.value);
      } catch (err) {
        Toast.error('Invalid JSON in Arguments');
        return;
      }

      statusBadge.textContent = 'Calling...';
      statusBadge.className = 'badge badge-warning';
      outputBox.textContent = 'Executing JSON-RPC tools/call...';

      try {
        const start = Date.now();
        const res = await api.callMcpGatewayTool(toolName, args);
        const duration = Date.now() - start;

        statusBadge.textContent = `200 OK (${duration}ms)`;
        statusBadge.className = 'badge badge-success';
        outputBox.textContent = JSON.stringify(res, null, 2);
        Toast.success(`MCP Tool '${toolName}' executed in ${duration}ms!`);
      } catch (err) {
        statusBadge.textContent = 'Error';
        statusBadge.className = 'badge badge-danger';
        outputBox.textContent = `Error: ${err.message}`;
        Toast.error(err.message || 'Execution error');
      }
    });
  }
};
