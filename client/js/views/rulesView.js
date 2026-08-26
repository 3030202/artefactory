import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { renderEmptyState } from '../components/emptyState.js';

export const rulesView = {
  rules: [],
  selectedPriority: 'all',
  searchQuery: '',

  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading Rules & Directives Registry...</div>`;
    await this.loadRules(container);
  },

  async loadRules(container) {
    try {
      const res = await api.getRules();
      this.rules = res.data || [];
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load rules: ${err.message}</div>`;
    }
  },

  renderUI(container) {
    let filtered = this.rules;
    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === this.selectedPriority);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.content && r.content.toLowerCase().includes(q)) ||
        (r.target_file && r.target_file.toLowerCase().includes(q)) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <span>🔴</span>
            <span>Rules, Guardrails & Directives</span>
            <span class="badge badge-rules">${this.rules.length} Rules</span>
            <span class="badge badge-success" style="font-size: 11px;">● Continuous Live Stream</span>
          </div>
          <div class="section-desc">
            Постоянно обновляемый реестр правил и гардрайлов ИИ (OWASP GenAI Top 10, MITRE ATLAS, Constitutional AI, AGENTS.md) с проверкой инвариантов и компилятором директив.
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-sync-rules" title="Обновить правила из источников">
            <span>🔄</span> Live Sync Feed
          </button>
          <button class="btn btn-secondary" id="btn-compile-rules">
            <span>📜</span> Compile System Directives
          </button>
          <button class="btn btn-primary" id="btn-create-rule">
            <span>✨</span> New Rule Directive
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon-inside">🔍</span>
          <input type="text" class="search-input" id="rules-search" placeholder="Поиск правил и директив..." value="${this.searchQuery}">
        </div>
        <div class="tag-chips-container">
          <div class="tag-chip ${this.selectedPriority === 'all' ? 'active' : ''}" data-priority="all">All Priorities</div>
          <div class="tag-chip ${this.selectedPriority === 'CRITICAL' ? 'active' : ''}" data-priority="CRITICAL">Critical Guardrails</div>
          <div class="tag-chip ${this.selectedPriority === 'HIGH' ? 'active' : ''}" data-priority="HIGH">High Priority</div>
          <div class="tag-chip ${this.selectedPriority === 'MEDIUM' ? 'active' : ''}" data-priority="MEDIUM">Medium / Style</div>
        </div>
      </div>

      <!-- Rules Grid -->
      <div class="cards-grid">
        ${filtered.length === 0 ? renderEmptyState('rules') : filtered.map(r => `
          <div class="artifact-card" data-id="${r.id}">
            <div class="card-header">
              <div>
                ${r.source_title ? `<div class="badge badge-sources" style="font-size: 9px; margin-bottom: 3px;">📡 ${r.source_title}</div>` : ''}
                <div class="card-title">${r.title}</div>
                <div style="font-family: var(--font-mono); font-size: 11px; color: #fb7185; margin-top: 2px;">Target: ${r.target_file || 'AGENTS.md'}</div>
              </div>
              <div class="flex-center gap-xs">
                <span class="badge ${r.priority === 'CRITICAL' ? 'badge-danger' : (r.priority === 'HIGH' ? 'badge-warning' : 'badge-rules')}">${r.priority}</span>
                ${r.auto_synced ? `<span class="badge badge-success" style="font-size: 9px;">Live</span>` : ''}
              </div>
            </div>

            <div class="card-desc">${r.description || 'No description provided.'}</div>

            <!-- Content preview -->
            <pre style="background: #050811; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); max-height: 100px; overflow: hidden; text-overflow: ellipsis; white-space: pre-wrap;">${r.content || ''}</pre>

            <div class="card-tags">
              ${(r.tags || []).map(t => `<span class="badge badge-rules">#${t}</span>`).join('')}
            </div>

            <div class="card-footer">
              <button class="btn btn-primary btn-sm btn-open-rule-editor" data-id="${r.id}" style="padding: 6px 12px; font-size: 12px;">
                <span>✏️</span> Edit Rule
              </button>
              <div class="card-actions">
                <button class="btn-icon btn-delete-rule" data-id="${r.id}" title="Delete" style="color: var(--status-danger);">🗑️</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Listeners
    container.querySelector('#btn-sync-rules')?.addEventListener('click', async () => {
      Toast.info('Синхронизация правил из канонических источников...');
      try {
        await api.syncSources();
        Toast.success('Реестр правил и гардрайлов успешно обновлен!');
        await this.loadRules(container);
        if (window.appRouter) window.appRouter.updateStatsCounters();
      } catch (err) {
        Toast.error(err.message || 'Ошибка синхронизации');
      }
    });

    const searchInput = container.querySelector('#rules-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderUI(container);
      const input = container.querySelector('#rules-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    container.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.selectedPriority = chip.getAttribute('data-priority');
        this.renderUI(container);
      });
    });

    container.querySelector('#btn-create-rule')?.addEventListener('click', () => {
      this.openEditModal(null, container);
    });

    container.querySelector('.btn-empty-primary')?.addEventListener('click', () => {
      this.openEditModal(null, container);
    });

    container.querySelector('.btn-empty-secondary')?.addEventListener('click', async () => {
      Toast.info('Запуск синхронизации правил безопасности...');
      try {
        await api.syncSources();
        Toast.success('Правила успешно обновлены!');
        await this.loadRules(container);
      } catch (err) {
        Toast.error(err.message || 'Ошибка синхронизации');
      }
    });

    container.querySelector('#btn-compile-rules')?.addEventListener('click', async () => {
      const res = await api.compileRules();
      this.openCompiledModal(res.compiled_markdown);
    });

    container.querySelectorAll('.btn-open-rule-editor').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rule = this.rules.find(r => r.id === id);
        if (rule) this.openEditModal(rule, container);
      });
    });

    container.querySelectorAll('.btn-delete-rule').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this rule directive?')) {
          await api.deleteRule(id);
          Toast.success('Rule deleted.');
          await this.loadRules(container);
        }
      });
    });
  },

  // Modal: Edit or Create Rule
  openEditModal(rule, container) {
    const isEdit = Boolean(rule);
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>${isEdit ? '✏️ Edit Rule Directive' : '✨ New Rule Directive'}</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Rule Title *</label>
            <input type="text" class="form-input" id="rule-title" value="${isEdit ? rule.title : ''}" placeholder="e.g. Non-Destructive Storage Operation Guardrail">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Target File</label>
              <input type="text" class="form-input" id="rule-target" value="${isEdit ? rule.target_file : 'AGENTS.md'}" placeholder="AGENTS.md or GEMINI.md">
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" id="rule-priority">
                <option value="CRITICAL" ${isEdit && rule.priority === 'CRITICAL' ? 'selected' : ''}>CRITICAL (Hard safety invariant)</option>
                <option value="HIGH" ${isEdit && rule.priority === 'HIGH' ? 'selected' : ''}>HIGH (Architecture standard)</option>
                <option value="MEDIUM" ${!isEdit || rule.priority === 'MEDIUM' ? 'selected' : ''}>MEDIUM (Style & Formatting)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" id="rule-desc" value="${isEdit ? (rule.description || '') : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Rule Directives Markdown *</label>
            <textarea class="form-input" id="rule-content" rows="8" style="font-family: var(--font-mono); font-size: 12px;">${isEdit ? rule.content : '# Directive Title\n\n1. Must always adhere to...'}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Cancel</button>
          <button class="btn btn-primary" id="btn-save-rule">Save Directive</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('#btn-save-rule')?.addEventListener('click', async () => {
      const title = backdrop.querySelector('#rule-title')?.value.trim();
      const target_file = backdrop.querySelector('#rule-target')?.value.trim();
      const priority = backdrop.querySelector('#rule-priority')?.value;
      const description = backdrop.querySelector('#rule-desc')?.value.trim();
      const content = backdrop.querySelector('#rule-content')?.value;

      if (!title || !content) {
        Toast.error('Title and Content are required.');
        return;
      }

      if (isEdit) {
        await api.updateRule(rule.id, {
          title,
          target_file,
          priority,
          description,
          content
        });
        Toast.success('Rule updated.');
      } else {
        await api.createRule({
          title,
          target_file,
          priority,
          description,
          content
        });
        Toast.success('Rule created.');
      }

      backdrop.remove();
      await this.loadRules(container);
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Consolidated System Directives Compiler
  openCompiledModal(compiledMarkdown) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-header">
          <div class="modal-title">
            <span>📜</span>
            <span>Compiled System Directives Protocol</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
            This combined document consolidates all active rules sorted by priority (CRITICAL -> HIGH -> MEDIUM) for injection into Agent System Prompts or root <code>AGENTS.md</code>.
          </div>
          <textarea class="form-input" readonly rows="16" style="font-family: var(--font-mono); font-size: 12px; color: #fb7185;">${compiledMarkdown}</textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-copy-compiled">Copy Markdown</button>
          <button class="btn btn-secondary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelector('#btn-copy-compiled')?.addEventListener('click', () => {
      navigator.clipboard.writeText(compiledMarkdown);
      Toast.success('Compiled system directives copied!');
    });
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  }
};
