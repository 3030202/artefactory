import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { DAGCanvas } from '../components/dagCanvas.js';

export const workflowsView = {
  workflows: [],
  selectedWf: null,
  searchQuery: '',

  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading Workflows DAG Registry...</div>`;
    await this.loadWorkflows(container);
  },

  async loadWorkflows(container) {
    try {
      const res = await api.getWorkflows();
      this.workflows = res.data || [];
      if (this.workflows.length > 0 && !this.selectedWf) {
        this.selectedWf = this.workflows[0];
      }
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load workflows: ${err.message}</div>`;
    }
  },

  renderUI(container) {
    let filtered = this.workflows;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(w =>
        (w.title && w.title.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.tags && w.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <span>🟡</span>
            <span>Workflows & DAG Pipelines</span>
            <span class="badge badge-workflows">${this.workflows.length} Pipelines</span>
            <span class="badge badge-success" style="font-size: 11px;">● Continuous Live Stream</span>
          </div>
          <div class="section-desc">
            Постоянно обновляемый реестр многоагентных DAG графов (LangGraph, DSPy Teleprompter, Promptfoo Matrix) с интерактивной симуляцией.
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-sync-workflows" title="Обновить воркфлоу из источников">
            <span>🔄</span> Live Sync Feed
          </button>
          <button class="btn btn-primary" id="btn-create-workflow">
            <span>✨</span> New Workflow DAG
          </button>
        </div>
      </div>

      <!-- Main Layout: Left Selector & Right Interactive Canvas -->
      <div style="display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start;">
        <!-- Left: Workflow List -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="search-input-wrapper">
            <span class="search-icon-inside">🔍</span>
            <input type="text" class="search-input" id="wf-search" placeholder="Поиск воркфлоу..." value="${this.searchQuery}">
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; max-height: 600px; overflow-y: auto;">
            ${filtered.map(w => `
              <div class="artifact-card ${this.selectedWf && this.selectedWf.id === w.id ? 'active' : ''}" data-id="${w.id}" style="cursor: pointer; padding: 16px; ${this.selectedWf && this.selectedWf.id === w.id ? 'border-color: var(--cat-workflows); background: rgba(245, 158, 11, 0.1);' : ''}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <div>
                    ${w.source_title ? `<div class="badge badge-sources" style="font-size: 9px; margin-bottom: 3px;">📡 ${w.source_title}</div>` : ''}
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${w.title}</div>
                  </div>
                  <div class="flex-center gap-xs">
                    <span class="badge badge-workflows">v${w.version || '1.0'}</span>
                    ${w.auto_synced ? `<span class="badge badge-success" style="font-size: 9px;">Live</span>` : ''}
                  </div>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 8px;">${w.description || ''}</div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                  <span>🔗 ${(w.nodes || []).length} nodes, ${(w.edges || []).length} edges</span>
                  <span class="badge badge-success">${w.status || 'READY'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Active DAG Visualizer & Controls -->
        <div>
          ${this.selectedWf ? `
            <div class="artifact-card" style="padding: 20px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                    <span>${this.selectedWf.title}</span>
                    <span class="badge badge-workflows">Interactive Canvas</span>
                  </div>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${this.selectedWf.description}</div>
                </div>
                <div class="header-actions">
                  <button class="btn btn-primary" id="btn-run-simulation">
                    <span>▶️</span> Run Simulation
                  </button>
                  <button class="btn btn-secondary" id="btn-export-dag">
                    <span>📋</span> Export JSON
                  </button>
                </div>
              </div>

              <!-- DAG Canvas Mount -->
              <div id="dag-canvas-container" style="margin-bottom: 16px;"></div>

              <!-- Node Inspector Box -->
              <div id="node-inspector" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; display: none;">
                <div style="font-weight: 600; font-size: 13px; color: var(--cat-workflows); margin-bottom: 4px;" id="insp-title">Node Inspector</div>
                <div style="font-size: 12px; color: var(--text-secondary);" id="insp-body"></div>
              </div>
            </div>
          ` : `
            <div class="artifact-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
              Выберите воркфлоу из списка слева для просмотра и симуляции DAG графа.
            </div>
          `}
        </div>
      </div>
    `;

    // Render DAG Canvas
    if (this.selectedWf) {
      const canvasContainer = container.querySelector('#dag-canvas-container');
      if (canvasContainer) {
        const dag = new DAGCanvas(canvasContainer, {
          onNodeClick: (node) => {
            const insp = container.querySelector('#node-inspector');
            const inspTitle = container.querySelector('#insp-title');
            const inspBody = container.querySelector('#insp-body');
            if (insp && inspTitle && inspBody) {
              insp.style.display = 'block';
              inspTitle.textContent = `Inspector: [${node.label}] (Type: ${node.type})`;
              inspBody.innerHTML = `
                <div><strong>Node ID:</strong> <code>${node.id}</code></div>
                <div><strong>Linked Reference:</strong> <code>${node.refId || 'None (Custom Step)'}</code></div>
                <div><strong>Execution Status:</strong> <span class="badge badge-success">${node.status}</span></div>
              `;
            }
          }
        });
        dag.render(this.selectedWf);
      }
    }

    // Attach listeners
    container.querySelectorAll('.artifact-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        this.selectedWf = this.workflows.find(w => w.id === id);
        this.renderUI(container);
      });
    });

    container.querySelector('#btn-run-simulation')?.addEventListener('click', () => {
      if (this.selectedWf) this.openSimulationModal(this.selectedWf);
    });

    container.querySelector('#btn-export-dag')?.addEventListener('click', () => {
      if (this.selectedWf) {
        navigator.clipboard.writeText(JSON.stringify(this.selectedWf, null, 2));
        Toast.success('DAG JSON definition copied to clipboard!');
      }
    });

    container.querySelector('#btn-sync-workflows')?.addEventListener('click', async () => {
      Toast.info('Синхронизация воркфлоу из канонических источников...');
      try {
        await api.syncSources();
        Toast.success('Реестр воркфлоу успешно обновлен!');
        await this.loadWorkflows(container);
        if (window.appRouter) window.appRouter.updateStatsCounters();
      } catch (err) {
        Toast.error(err.message || 'Ошибка синхронизации');
      }
    });

    container.querySelector('#btn-create-workflow')?.addEventListener('click', () => {
      this.openCreateModal(container);
    });
  },

  // Modal: Live Pipeline Execution & Step Simulation
  openSimulationModal(wf) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-header">
          <div class="modal-title">
            <span>▶️</span>
            <span>DAG Pipeline Simulator: <strong>${wf.title}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">
              Simulating step-by-step agentic execution for <strong>${(wf.nodes || []).length} DAG nodes</strong>...
            </div>
            <div style="font-family: var(--font-mono); font-size: 12px; color: #fbbf24;" id="sim-timer">Elapsed: 0ms</div>
          </div>

          <!-- Execution Terminal -->
          <div id="sim-terminal" style="background: #050811; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; height: 360px; overflow-y: auto; font-family: var(--font-mono); font-size: 12px; line-height: 1.7; display: flex; flex-direction: column; gap: 8px;">
            <div style="color: #94a3b8;">[INIT] Loading DAG execution graph '${wf.title}'...</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-start-sim">
            <span>🚀</span> Start Execution
          </button>
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const term = backdrop.querySelector('#sim-terminal');
    const timer = backdrop.querySelector('#sim-timer');
    const startBtn = backdrop.querySelector('#btn-start-sim');

    startBtn?.addEventListener('click', async () => {
      startBtn.disabled = true;
      startBtn.innerHTML = `<span>⏳</span> Running...`;

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (timer) timer.textContent = `Elapsed: ${Date.now() - startTime}ms`;
      }, 50);

      try {
        const res = await api.simulateWorkflow(wf.id);
        const trace = res.trace || [];

        for (const step of trace) {
          await new Promise(r => setTimeout(r, 450));
          const line = document.createElement('div');
          line.style.padding = '4px 8px';
          line.style.borderRadius = '4px';
          line.style.background = 'rgba(16, 185, 129, 0.08)';
          line.style.color = '#34d399';
          line.innerHTML = `<strong>[STEP ${step.step}/${trace.length}]</strong> Node <code>${step.label}</code> (${step.type}) -> Status: <strong>${step.status}</strong> (${step.duration_ms}ms)<br><span style="color: #94a3b8; font-size: 11px;">${step.message}</span>`;
          term.appendChild(line);
          term.scrollTop = term.scrollHeight;
        }

        clearInterval(interval);
        const finalLine = document.createElement('div');
        finalLine.style.color = '#fbbf24';
        finalLine.style.fontWeight = 'bold';
        finalLine.style.marginTop = '12px';
        finalLine.textContent = `[SUCCESS] All ${trace.length} nodes completed successfully in ${Date.now() - startTime}ms!`;
        term.appendChild(finalLine);
        term.scrollTop = term.scrollHeight;

        startBtn.innerHTML = `<span>✅</span> Completed`;
        Toast.success('Pipeline simulated successfully!');
      } catch (err) {
        clearInterval(interval);
        Toast.error('Simulation failed: ' + err.message);
      }
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Create Workflow
  openCreateModal(container) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>✨ New Workflow DAG</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Workflow Title *</label>
            <input type="text" class="form-input" id="wf-title" placeholder="e.g. Model Evaluation & Benchmark DAG">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" id="wf-desc" placeholder="Pipeline purpose and target steps">
          </div>
          <div class="form-group">
            <label class="form-label">Tags (comma separated)</label>
            <input type="text" class="form-input" id="wf-tags" value="ci-cd, pipeline, testing">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Cancel</button>
          <button class="btn btn-primary" id="btn-save-new-wf">Create Workflow</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('#btn-save-new-wf')?.addEventListener('click', async () => {
      const title = backdrop.querySelector('#wf-title')?.value.trim();
      const description = backdrop.querySelector('#wf-desc')?.value.trim();
      const tags = (backdrop.querySelector('#wf-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);

      if (!title) {
        Toast.error('Workflow title is required.');
        return;
      }

      const res = await api.createWorkflow({
        title,
        description,
        tags,
        nodes: [
          { id: 'node_1', type: 'trigger', label: 'Trigger Event', status: 'READY', x: 100, y: 150 },
          { id: 'node_2', type: 'prompt', label: 'Prompt Execution', status: 'READY', x: 350, y: 150 },
          { id: 'node_3', type: 'code', label: 'Validation Check', status: 'READY', x: 600, y: 150 }
        ],
        edges: [
          { from: 'node_1', to: 'node_2', label: 'Triggered' },
          { from: 'node_2', to: 'node_3', label: 'Output Passed' }
        ]
      });

      Toast.success('Workflow created.');
      backdrop.remove();
      this.selectedWf = res.data;
      await this.loadWorkflows(container);
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  }
};
