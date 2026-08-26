import { api } from '../api.js';
import { Toast } from './toast.js';
import { Icons } from './icons.js';

export class McpInspector {
  static async openModal(initialServer = null) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window" style="max-width: 960px; width: 96%; height: 88vh; display: flex; flex-direction: column;">
        <div class="modal-drag-handle"></div>
        
        <!-- Inspector Header -->
        <div class="modal-header" style="flex-shrink: 0;">
          <div class="modal-title">
            <span>${Icons.mcp(20)}</span>
            <span>Model Context Protocol (MCP) Inspector Sandbox</span>
            <span class="badge badge-mcp" style="font-size: 10px;">JSON-RPC 2.0</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <!-- Connection Bar -->
        <div style="padding: 10px 20px; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px;">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); white-space: nowrap;">Target Server:</label>
            <select class="form-select" id="mcp-target-server" style="flex: 1; padding: 6px 10px; font-size: 12px;">
              <option value="native_gateway" selected>⚡ Native Control Tower Gateway (SSE: /mcp/sse)</option>
              <option value="mcp_github">🐙 GitHub MCP Server (Stdio)</option>
              <option value="mcp_sqlite">🗄️ SQLite MCP Server (Stdio)</option>
              <option value="mcp_puppeteer">🌐 Puppeteer MCP Server (Stdio)</option>
              <option value="mcp_ollama">🤖 Ollama MCP Server (Stdio)</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-success" id="mcp-conn-status">CONNECTED</span>
            <button class="btn btn-secondary btn-sm" id="btn-mcp-ping" style="font-size: 11px; padding: 5px 10px;">
              📡 Ping Server
            </button>
          </div>
        </div>

        <!-- Main Body: Left Tool/Method Picker & Right Split Inspector -->
        <div class="modal-body mcp-inspector-body" style="flex: 1;">
          
          <!-- Left Column: Methods & Tools List -->
          <div style="display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; overflow-y: auto;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
              Protocol Methods
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;" id="mcp-method-list">
              <button class="chip-btn active" data-method="tools/list" style="text-align: left; justify-content: flex-start; padding: 7px 10px; font-size: 12px;">
                🛠️ tools/list
              </button>
              <button class="chip-btn" data-method="tools/call" style="text-align: left; justify-content: flex-start; padding: 7px 10px; font-size: 12px;">
                ⚡ tools/call
              </button>
              <button class="chip-btn" data-method="prompts/list" style="text-align: left; justify-content: flex-start; padding: 7px 10px; font-size: 12px;">
                📝 prompts/list
              </button>
              <button class="chip-btn" data-method="resources/list" style="text-align: left; justify-content: flex-start; padding: 7px 10px; font-size: 12px;">
                📄 resources/list
              </button>
              <button class="chip-btn" data-method="initialize" style="text-align: left; justify-content: flex-start; padding: 7px 10px; font-size: 12px;">
                🤝 initialize
              </button>
            </div>

            <!-- Available Tools Picker (when tools/call is selected) -->
            <div id="mcp-tools-picker-section" style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
                Select Tool to Call
              </div>
              <div id="mcp-available-tools-list" style="display: flex; flex-direction: column; gap: 4px;">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>

          <!-- Right Column: Schema Form + Request/Response Split Pane -->
          <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
            
            <!-- Dynamic Parameters Form -->
            <div id="mcp-params-form-container" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);" id="mcp-form-title">
                  Method Parameters & Schema
                </div>
                <button class="btn btn-primary btn-sm" id="btn-execute-mcp-request" style="font-size: 12px; padding: 5px 14px;">
                  🚀 Execute JSON-RPC
                </button>
              </div>

              <div id="mcp-dynamic-form-fields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Dynamic form fields -->
              </div>
            </div>

            <!-- Split JSON Inspector (Request & Response) -->
            <div class="mcp-json-split">
              
              <!-- Request JSON Editor -->
              <div style="display: flex; flex-direction: column; background: #05070d; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
                <div style="padding: 8px 12px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 600; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
                  <span>JSON-RPC 2.0 Request</span>
                  <span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 10px;">POST /mcp/messages</span>
                </div>
                <textarea id="mcp-request-json" style="flex: 1; background: transparent; border: none; padding: 10px; font-family: var(--font-mono); font-size: 11.5px; color: #93c5fd; resize: none; outline: none; line-height: 1.5;"></textarea>
              </div>

              <!-- Response JSON Viewer -->
              <div style="display: flex; flex-direction: column; background: #05070d; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
                <div style="padding: 8px 12px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 600; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
                  <span>JSON-RPC 2.0 Response</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="mcp-response-timing" style="font-family: var(--font-mono); font-size: 10px; color: #34d399;">-- ms</span>
                    <button class="btn-icon" id="btn-copy-response" title="Copy response JSON" style="padding: 2px 6px; font-size: 10px;">📋</button>
                  </div>
                </div>
                <pre id="mcp-response-json" style="flex: 1; margin: 0; padding: 10px; font-family: var(--font-mono); font-size: 11.5px; color: #86efac; overflow: auto; line-height: 1.5; white-space: pre-wrap;">{}</pre>
              </div>

            </div>

          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer" style="flex-shrink: 0;">
          <div style="font-size: 11px; color: var(--text-muted);">
            Compliant with MCP Protocol 2024-11-05 standard
          </div>
          <button class="btn btn-secondary btn-close-modal">Close Inspector</button>
        </div>

      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    let selectedMethod = 'tools/call';
    let selectedTool = 'search_artifacts';
    let availableTools = [];

    // Load available tools
    const fetchTools = async () => {
      try {
        const res = await api.getMcpGatewaySchema();
        availableTools = res.tools || [];
        renderToolsList();
      } catch (err) {
        console.warn('Failed to load schema:', err);
      }
    };

    const renderToolsList = () => {
      const list = backdrop.querySelector('#mcp-available-tools-list');
      if (!list) return;

      list.innerHTML = availableTools.map(t => `
        <button class="chip-btn ${selectedTool === t.name ? 'active' : ''}" data-tool-name="${t.name}" style="text-align: left; padding: 6px 8px; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          🔧 ${t.name}
        </button>
      `).join('');

      list.querySelectorAll('[data-tool-name]').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedTool = btn.getAttribute('data-tool-name');
          renderToolsList();
          updateFormAndPayload();
        });
      });
    };

    const updateFormAndPayload = () => {
      const formContainer = backdrop.querySelector('#mcp-dynamic-form-fields');
      const reqTextarea = backdrop.querySelector('#mcp-request-json');

      if (selectedMethod === 'tools/call') {
        const tool = availableTools.find(t => t.name === selectedTool) || availableTools[0];
        const schema = tool?.inputSchema || { properties: {} };
        const props = schema.properties || {};

        formContainer.innerHTML = Object.keys(props).map(key => {
          const p = props[key];
          const isRequired = (schema.required || []).includes(key);
          const defaultVal = key === 'query' ? 'dspy' : (key === 'name' ? 'agent_supervisor' : (key === 'limit' ? 5 : ''));

          return `
            <div class="form-group" style="margin: 0; grid-column: ${p.type === 'string' && !p.enum ? 'span 2' : 'span 1'};">
              <label class="form-label" style="font-size: 11.5px; display: flex; justify-content: space-between;">
                <span>${key} ${isRequired ? '<span style="color: #f43f5e;">*</span>' : ''}</span>
                <span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 10px;">${p.type || 'any'}</span>
              </label>
              <input type="text" class="form-input mcp-arg-input" data-arg-key="${key}" placeholder="${p.description || ''}" value="${defaultVal}" style="padding: 6px 10px; font-size: 12px;">
            </div>
          `;
        }).join('') || '<div style="color: var(--text-muted); font-size: 12px; grid-column: span 2;">No input parameters required for this tool.</div>';

        // Listen for input changes to update raw JSON
        formContainer.querySelectorAll('.mcp-arg-input').forEach(inp => {
          inp.addEventListener('input', syncFormToPayload);
        });

        syncFormToPayload();
      } else if (selectedMethod === 'tools/list') {
        formContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; grid-column: span 2;">Lists all registered MCP tools and schema declarations.</div>';
        reqTextarea.value = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/list', params: {} }, null, 2);
      } else if (selectedMethod === 'prompts/list') {
        formContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; grid-column: span 2;">Lists registered prompts templates.</div>';
        reqTextarea.value = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'prompts/list', params: {} }, null, 2);
      } else if (selectedMethod === 'resources/list') {
        formContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; grid-column: span 2;">Lists canonical system resources and spec URIs.</div>';
        reqTextarea.value = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'resources/list', params: {} }, null, 2);
      } else if (selectedMethod === 'initialize') {
        formContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; grid-column: span 2;">Handshake protocol initialization request.</div>';
        reqTextarea.value = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, prompts: {}, resources: {} },
            clientInfo: { name: 'artefactory-inspector', version: '2.0.0' }
          }
        }, null, 2);
      }
    };

    const syncFormToPayload = () => {
      const reqTextarea = backdrop.querySelector('#mcp-request-json');
      const args = {};
      backdrop.querySelectorAll('.mcp-arg-input').forEach(inp => {
        const k = inp.getAttribute('data-arg-key');
        let val = inp.value;
        if (!isNaN(val) && val.trim() !== '') val = Number(val);
        args[k] = val;
      });

      const payload = {
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 10000),
        method: 'tools/call',
        params: {
          name: selectedTool,
          arguments: args
        }
      };

      reqTextarea.value = JSON.stringify(payload, null, 2);
    };

    // Method button clicks
    backdrop.querySelectorAll('[data-method]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMethod = btn.getAttribute('data-method');
        backdrop.querySelectorAll('[data-method]').forEach(b => b.classList.toggle('active', b === btn));
        backdrop.querySelector('#mcp-tools-picker-section').style.display = selectedMethod === 'tools/call' ? 'flex' : 'none';
        updateFormAndPayload();
      });
    });

    // Execute Request
    const executeRequest = async () => {
      const reqTextarea = backdrop.querySelector('#mcp-request-json');
      const respPre = backdrop.querySelector('#mcp-response-json');
      const timingEl = backdrop.querySelector('#mcp-response-timing');

      let parsedPayload;
      try {
        parsedPayload = JSON.parse(reqTextarea.value);
      } catch (err) {
        Toast.error('Invalid JSON in Request payload');
        return;
      }

      respPre.textContent = 'Executing JSON-RPC request...';
      const startTime = performance.now();

      try {
        const response = await fetch('/mcp/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedPayload)
        });
        const duration = Math.round(performance.now() - startTime);
        const data = await response.json();

        timingEl.textContent = `⏱️ ${duration} ms (HTTP ${response.status})`;
        timingEl.style.color = response.ok ? '#34d399' : '#f43f5e';
        respPre.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        timingEl.textContent = `⏱️ ${duration} ms (Failed)`;
        timingEl.style.color = '#f43f5e';
        respPre.textContent = JSON.stringify({ error: err.message }, null, 2);
      }
    };

    backdrop.querySelector('#btn-execute-mcp-request')?.addEventListener('click', executeRequest);

    backdrop.querySelector('#btn-copy-response')?.addEventListener('click', () => {
      const respPre = backdrop.querySelector('#mcp-response-json');
      navigator.clipboard.writeText(respPre.textContent);
      Toast.success('Response JSON copied to clipboard');
    });

    backdrop.querySelector('#btn-mcp-ping')?.addEventListener('click', async () => {
      try {
        const t0 = performance.now();
        await fetch('/mcp/schema');
        const dt = Math.round(performance.now() - t0);
        Toast.success(`MCP Gateway Pong! Latency: ${dt}ms`);
      } catch (err) {
        Toast.error(`Ping failed: ${err.message}`);
      }
    });

    await fetchTools();
    updateFormAndPayload();
  }
}
