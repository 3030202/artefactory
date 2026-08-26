import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { DiffViewer } from '../components/diffViewer.js';

export const promptsView = {
  prompts: [],
  selectedTag: 'all',
  searchQuery: '',

  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading Prompts Registry...</div>`;
    await this.loadPrompts(container);
  },

  async loadPrompts(container) {
    try {
      const res = await api.getPrompts();
      this.prompts = res.data || [];
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load prompts: ${err.message}</div>`;
    }
  },

  renderUI(container) {
    // Extract unique tags
    const allTags = new Set();
    this.prompts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

    // Filter prompts
    let filtered = this.prompts;
    if (this.selectedTag !== 'all') {
      filtered = filtered.filter(p => (p.tags || []).includes(this.selectedTag));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.template && p.template.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <span>🟣</span>
            <span>Prompts Registry & Studio</span>
            <span class="badge badge-prompts">${this.prompts.length} Prompts</span>
          </div>
          <div class="section-desc">
            Централизованный реестр системных и пользовательских промптов, шаблонизатор с переменными <code style="color: #c084fc;">{{var}}</code>, интерактивная песочница, подсчёт токенов и версионирование.
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-create-prompt">
            <span>✨</span> New Prompt Template
          </button>
        </div>
      </div>

      <!-- Filters & Tags -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon-inside">🔍</span>
          <input type="text" class="search-input" id="prompts-search" placeholder="Поиск по названию, тегам или содержимому..." value="${this.searchQuery}">
        </div>
        <div class="tag-chips-container">
          <div class="tag-chip ${this.selectedTag === 'all' ? 'active' : ''}" data-tag="all">All Tags</div>
          ${Array.from(allTags).map(tag => `
            <div class="tag-chip ${this.selectedTag === tag ? 'active' : ''}" data-tag="${tag}">#${tag}</div>
          `).join('')}
        </div>
      </div>

      <!-- Prompts Grid -->
      <div class="cards-grid">
        ${filtered.length === 0 ? `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
            Промпты не найдены по заданным критериям.
          </div>
        ` : filtered.map(p => `
          <div class="artifact-card" data-id="${p.id}">
            <div class="card-header">
              <div class="card-title">${p.title}</div>
              <span class="badge badge-version">v${p.version || '1.0.0'}</span>
            </div>
            <div class="card-desc">${p.description || 'No description provided.'}</div>
            
            <div class="card-metadata">
              <span>🤖 ${p.model || 'Universal'}</span>
              <span>•</span>
              <span>📊 ~${Math.ceil((p.template || '').length / 4)} tokens</span>
              <span>•</span>
              <span>🔤 ${(p.variables || []).length} vars</span>
            </div>

            <div class="card-tags">
              ${(p.tags || []).map(t => `<span class="badge badge-prompts">#${t}</span>`).join('')}
            </div>

            <div class="card-footer">
              <button class="btn btn-primary btn-sm btn-open-playground" data-id="${p.id}" style="padding: 6px 12px; font-size: 12px;">
                <span>⚡</span> Playground
              </button>
              <div class="card-actions">
                <button class="btn-icon btn-export-code" data-id="${p.id}" title="Export Code (cURL, Python, JS)">📋</button>
                <button class="btn-icon btn-diff-history" data-id="${p.id}" title="Version History & Diff">📜</button>
                <button class="btn-icon btn-edit-prompt" data-id="${p.id}" title="Edit Template">✏️</button>
                <button class="btn-icon btn-delete-prompt" data-id="${p.id}" title="Delete" style="color: var(--status-danger);">🗑️</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Attach listeners
    const searchInput = container.querySelector('#prompts-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderUI(container);
      const input = container.querySelector('#prompts-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    container.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.selectedTag = chip.getAttribute('data-tag');
        this.renderUI(container);
      });
    });

    container.querySelector('#btn-create-prompt')?.addEventListener('click', () => {
      this.openEditModal(null, container);
    });

    container.querySelectorAll('.btn-open-playground').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) this.openPlaygroundModal(prompt);
      });
    });

    container.querySelectorAll('.btn-edit-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) this.openEditModal(prompt, container);
      });
    });

    container.querySelectorAll('.btn-diff-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) this.openHistoryModal(prompt);
      });
    });

    container.querySelectorAll('.btn-export-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) this.openExportModal(prompt);
      });
    });

    container.querySelectorAll('.btn-delete-prompt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this prompt template?')) {
          await api.deletePrompt(id);
          Toast.success('Prompt deleted.');
          await this.loadPrompts(container);
        }
      });
    });
  },

  // Modal: Playground / Interactive Testing
  openPlaygroundModal(prompt) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const vars = prompt.variables || [];
    const varInputsHtml = vars.length > 0 ? vars.map(v => `
      <div class="form-group" style="margin-bottom: 12px;">
        <label class="form-label" style="display: flex; justify-content: space-between;">
          <span style="color: #c084fc; font-family: var(--font-mono);">{{${v.name}}}</span>
          <span style="font-size: 11px; color: var(--text-muted);">${v.description || ''}</span>
        </label>
        <textarea class="form-input var-input" data-var="${v.name}" rows="2" style="font-size: 12px;">${v.defaultValue || ''}</textarea>
      </div>
    `).join('') : '<div style="color: var(--text-muted); font-size: 12px;">No variables detected in template.</div>';

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-header">
          <div class="modal-title">
            <span>⚡</span>
            <span>Prompt Studio & Live Playground: <strong>${prompt.title}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="split-pane" style="height: 520px;">
            <!-- Left Pane: Variables Injector -->
            <div class="editor-pane">
              <div class="pane-header">
                <span>🎛️ Variables & Parameters</span>
                <span class="badge badge-prompts">${prompt.model || 'claude-3-7-sonnet'}</span>
              </div>
              <div style="padding: 16px; overflow-y: auto; flex: 1;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px;">Inject Variable Values:</div>
                <div id="var-inputs-container">${varInputsHtml}</div>

                <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                    <span style="color: var(--text-secondary);">Temperature</span>
                    <span id="temp-val" style="font-family: var(--font-mono);">${prompt.temperature || 0.7}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value="${prompt.temperature || 0.7}" id="temp-slider" style="width: 100%;">
                </div>
              </div>
            </div>

            <!-- Right Pane: Rendered Prompt Output -->
            <div class="preview-pane">
              <div class="pane-header">
                <span>📄 Rendered Prompt Output</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge badge-version" id="token-count">Tokens: ...</span>
                  <button class="btn btn-secondary btn-sm" id="btn-copy-rendered" style="padding: 3px 8px; font-size: 11px;">Copy</button>
                </div>
              </div>
              <div class="preview-content" id="rendered-output-box"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const updateRendered = () => {
      const currentVars = {};
      backdrop.querySelectorAll('.var-input').forEach(input => {
        currentVars[input.getAttribute('data-var')] = input.value;
      });

      let rendered = prompt.template;
      (prompt.variables || []).forEach(v => {
        const val = currentVars[v.name] !== undefined ? currentVars[v.name] : (v.defaultValue || `[MISSING: ${v.name}]`);
        const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, 'g');
        rendered = rendered.replace(regex, val);
      });

      const outputBox = backdrop.querySelector('#rendered-output-box');
      if (outputBox) outputBox.textContent = rendered;

      const tokenCount = backdrop.querySelector('#token-count');
      if (tokenCount) tokenCount.textContent = `Tokens: ~${Math.ceil(rendered.length / 4)} (${rendered.length} chars)`;
    };

    updateRendered();

    backdrop.querySelectorAll('.var-input').forEach(input => {
      input.addEventListener('input', updateRendered);
    });

    backdrop.querySelector('#temp-slider')?.addEventListener('input', (e) => {
      const val = backdrop.querySelector('#temp-val');
      if (val) val.textContent = e.target.value;
    });

    backdrop.querySelector('#btn-copy-rendered')?.addEventListener('click', () => {
      const text = backdrop.querySelector('#rendered-output-box')?.textContent || '';
      navigator.clipboard.writeText(text);
      Toast.success('Rendered prompt copied to clipboard!');
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Edit or Create Prompt
  openEditModal(prompt, container) {
    const isEdit = Boolean(prompt);
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>${isEdit ? '✏️ Edit Prompt Template' : '✨ New Prompt Template'}</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="edit-title" value="${isEdit ? prompt.title : ''}" placeholder="e.g. System Architecture & Tech Spec Generator">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" id="edit-desc" value="${isEdit ? (prompt.description || '') : ''}" placeholder="Short summary of this prompt's purpose">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Target Model</label>
              <input type="text" class="form-input" id="edit-model" value="${isEdit ? (prompt.model || 'claude-3-7-sonnet') : 'claude-3-7-sonnet'}">
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tags" value="${isEdit ? (prompt.tags || []).join(', ') : 'architecture, spec'}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Template Content (Use {{VARIABLE_NAME}} for dynamic placeholders) *</label>
            <textarea class="form-input" id="edit-template" rows="10" style="font-family: var(--font-mono); font-size: 13px;">${isEdit ? prompt.template : 'You are an expert AI assistant.\n\nTask: {{TASK_DESCRIPTION}}\n\nConstraints: {{CONSTRAINTS}}'}</textarea>
          </div>
          ${isEdit ? `
            <div class="form-group">
              <label class="form-label">Version Update Note</label>
              <input type="text" class="form-input" id="edit-note" placeholder="e.g. Added constraint parameters">
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Cancel</button>
          <button class="btn btn-primary" id="btn-save-prompt">
            <span>💾</span> Save Prompt
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('#btn-save-prompt')?.addEventListener('click', async () => {
      const title = backdrop.querySelector('#edit-title')?.value.trim();
      const description = backdrop.querySelector('#edit-desc')?.value.trim();
      const model = backdrop.querySelector('#edit-model')?.value.trim();
      const tags = (backdrop.querySelector('#edit-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      const template = backdrop.querySelector('#edit-template')?.value;
      const note = backdrop.querySelector('#edit-note')?.value;

      if (!title || !template) {
        Toast.error('Title and Template are required.');
        return;
      }

      if (isEdit) {
        await api.updatePrompt(prompt.id, {
          title,
          description,
          model,
          tags,
          template,
          version_note: note
        });
        Toast.success('Prompt updated successfully.');
      } else {
        await api.createPrompt({
          title,
          description,
          model,
          tags,
          template
        });
        Toast.success('New prompt created successfully.');
      }

      backdrop.remove();
      await this.loadPrompts(container);
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Version Diff & History
  openHistoryModal(prompt) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const history = prompt.history || [];
    const latestSnapshot = prompt.template || '';
    const prevSnapshot = (history[1] && history[1].content_snapshot) || history[0]?.content_snapshot || '';

    const diff = DiffViewer.computeLineDiff(prevSnapshot, latestSnapshot);
    const diffHtml = DiffViewer.renderToHtml(diff);

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>📜</span>
            <span>Version History & Diff: <strong>${prompt.title}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Version Change Log:</div>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
            ${history.map(h => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; font-size: 12px;">
                <div>
                  <span class="badge badge-version">v${h.version}</span>
                  <span style="margin-left: 8px; color: var(--text-primary);">${h.note || 'Version update'}</span>
                </div>
                <span style="color: var(--text-muted); font-family: var(--font-mono);">${new Date(h.timestamp).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>

          <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Visual Diff (Previous vs Current):</div>
          ${diffHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Export Code Snippets
  openExportModal(prompt) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const pythonCode = `# Python (Google GenAI / Anthropic SDK)
import anthropic

client = anthropic.Anthropic()
message = client.messages.create(
    model="${prompt.model || 'claude-3-7-sonnet-20250219'}",
    max_tokens=${prompt.max_tokens || 4000},
    temperature=${prompt.temperature || 0.7},
    system="""${prompt.template}""",
    messages=[{"role": "user", "content": "Execute task"}]
)
print(message.content)
`;

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>📋</span>
            <span>Export Prompt Code: <strong>${prompt.title}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Python SDK Snippet</label>
            <textarea class="form-input" readonly rows="12" style="font-family: var(--font-mono); font-size: 12px;">${pythonCode}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-copy-export">Copy Python Code</button>
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelector('#btn-copy-export')?.addEventListener('click', () => {
      navigator.clipboard.writeText(pythonCode);
      Toast.success('Python snippet copied to clipboard!');
    });
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  }
};
