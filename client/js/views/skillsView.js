import { api } from '../api.js';
import { Toast } from '../components/toast.js';

export const skillsView = {
  skills: [],
  selectedTag: 'all',
  searchQuery: '',

  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading Skills Registry...</div>`;
    await this.loadSkills(container);
  },

  async loadSkills(container) {
    try {
      const res = await api.getSkills();
      this.skills = res.data || [];
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load skills: ${err.message}</div>`;
    }
  },

  renderUI(container) {
    const allTags = new Set();
    this.skills.forEach(s => (s.tags || []).forEach(t => allTags.add(t)));

    let filtered = this.skills;
    if (this.selectedTag !== 'all') {
      filtered = filtered.filter(s => (s.tags || []).includes(this.selectedTag));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.content && s.content.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <span>🟢</span>
            <span>Skills Registry & Validator</span>
            <span class="badge badge-skills">${this.skills.length} Skills</span>
            <span class="badge badge-success" style="font-size: 11px;">● Continuous Live Stream</span>
          </div>
          <div class="section-desc">
            Постоянно обновляемый реестр навыков агентов (Antigravity, MCP, LangGraph, Telegram) с валидацией YAML Frontmatter в <code style="color: #34d399;">SKILL.md</code>.
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-sync-skills" title="Обновить навыки из источников">
            <span>🔄</span> Live Sync Feed
          </button>
          <button class="btn btn-primary" id="btn-create-skill">
            <span>✨</span> New Skill (SKILL.md)
          </button>
        </div>
      </div>

      <!-- Filters & Tags -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon-inside">🔍</span>
          <input type="text" class="search-input" id="skills-search" placeholder="Поиск скиллов по имени, тегам, тулам..." value="${this.searchQuery}">
        </div>
        <div class="tag-chips-container">
          <div class="tag-chip ${this.selectedTag === 'all' ? 'active' : ''}" data-tag="all">All Tags</div>
          ${Array.from(allTags).map(tag => `
            <div class="tag-chip ${this.selectedTag === tag ? 'active' : ''}" data-tag="${tag}">#${tag}</div>
          `).join('')}
        </div>
      </div>

      <!-- Skills Grid -->
      <div class="cards-grid">
        ${filtered.length === 0 ? `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
            Скиллы не найдены по заданным критериям.
          </div>
        ` : filtered.map(s => `
          <div class="artifact-card" data-id="${s.id}">
            <div class="card-header">
              <div>
                ${s.source_title ? `<div class="badge badge-sources" style="font-size: 10px; margin-bottom: 4px;">📡 ${s.source_title}</div>` : ''}
                <div class="card-title">${s.title || s.name}</div>
                <div style="font-family: var(--font-mono); font-size: 11px; color: #34d399; margin-top: 2px;">skills/${s.name}/SKILL.md</div>
              </div>
              <div class="flex-center gap-xs">
                <span class="badge badge-version">v${s.version || '1.0.0'}</span>
                ${s.auto_synced ? `<span class="badge badge-success" style="font-size: 9px;">Live</span>` : ''}
              </div>
            </div>

            <div class="card-desc">${s.description || 'No description available.'}</div>

            <div class="card-metadata">
              <span>👤 ${s.author || 'System'}</span>
              <span>•</span>
              <span>🛠️ ${(s.tools_required || []).length} tools</span>
            </div>

            <div class="card-tags">
              ${(s.tools_required || []).map(tool => `<span class="badge" style="background: rgba(255,255,255,0.06); font-family: var(--font-mono); font-size: 10px;">${tool}</span>`).join('')}
              ${(s.tags || []).map(t => `<span class="badge badge-skills">#${t}</span>`).join('')}
            </div>

            <div class="card-footer">
              <button class="btn btn-primary btn-sm btn-open-validator" data-id="${s.id}" style="padding: 6px 12px; font-size: 12px;">
                <span>🧪</span> Validator Studio
              </button>
              <div class="card-actions">
                <button class="btn-icon btn-export-skill" data-id="${s.id}" title="Export to .agents/skills/ format">📦</button>
                <button class="btn-icon btn-edit-skill" data-id="${s.id}" title="Edit SKILL.md">✏️</button>
                <button class="btn-icon btn-delete-skill" data-id="${s.id}" title="Delete" style="color: var(--status-danger);">🗑️</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Listeners
    container.querySelector('#btn-sync-skills')?.addEventListener('click', async () => {
      Toast.info('Синхронизация навыков из канонических источников...');
      try {
        await api.syncSources();
        Toast.success('Реестр навыков успешно обновлен!');
        await this.loadSkills(container);
        if (window.appRouter) window.appRouter.updateStatsCounters();
      } catch (err) {
        Toast.error(err.message || 'Ошибка синхронизации');
      }
    });

    const searchInput = container.querySelector('#skills-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderUI(container);
      const input = container.querySelector('#skills-search');
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

    container.querySelector('#btn-create-skill')?.addEventListener('click', () => {
      this.openEditModal(null, container);
    });

    container.querySelectorAll('.btn-open-validator').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const skill = this.skills.find(s => s.id === id);
        if (skill) this.openValidatorModal(skill, container);
      });
    });

    container.querySelectorAll('.btn-export-skill').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await api.exportSkill(id);
        this.openExportModal(res);
      });
    });

    container.querySelectorAll('.btn-edit-skill').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const skill = this.skills.find(s => s.id === id);
        if (skill) this.openEditModal(skill, container);
      });
    });

    container.querySelectorAll('.btn-delete-skill').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this skill?')) {
          await api.deleteSkill(id);
          Toast.success('Skill deleted.');
          await this.loadSkills(container);
        }
      });
    });
  },

  // Modal: Skill Validator & Live Frontmatter Linter
  openValidatorModal(skill, container) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-header">
          <div class="modal-title">
            <span>🧪</span>
            <span>Skill Studio & Frontmatter Validator: <strong>${skill.name}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="split-pane" style="height: 520px;">
            <!-- Left: SKILL.md Live Editor -->
            <div class="editor-pane">
              <div class="pane-header">
                <span>📝 SKILL.md Content</span>
                <span class="badge badge-skills">Markdown + YAML</span>
              </div>
              <textarea class="code-textarea" id="skill-content-editor">${skill.content || ''}</textarea>
            </div>

            <!-- Right: Real-time Validator & Structure Explorer -->
            <div class="preview-pane">
              <div class="pane-header">
                <span>🔍 Frontmatter Schema Validation</span>
                <span class="badge badge-success" id="val-badge">Validating...</span>
              </div>
              <div style="padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
                <!-- Status Box -->
                <div id="val-status-box" style="padding: 12px; border-radius: 8px; font-size: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
                  Checking YAML frontmatter syntax...
                </div>

                <!-- Parsed Metadata -->
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Parsed Frontmatter Metadata:</div>
                <pre id="val-metadata-json" style="background: #070a12; padding: 12px; border-radius: 6px; font-family: var(--font-mono); font-size: 11px; color: #34d399; overflow-x: auto;"></pre>

                <!-- Structure Tree -->
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Simulated Skill Bundle Structure:</div>
                <div style="background: #070a12; padding: 12px; border-radius: 6px; font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">
                  <div>📁 .agents/skills/${skill.name}/</div>
                  <div style="padding-left: 20px; color: #34d399;">📄 SKILL.md</div>
                  <div style="padding-left: 20px; color: #94a3b8;">📁 scripts/</div>
                  <div style="padding-left: 20px; color: #94a3b8;">📁 references/</div>
                  <div style="padding-left: 20px; color: #94a3b8;">📄 metadata.json</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Close</button>
          <button class="btn btn-primary" id="btn-save-skill-content">
            <span>💾</span> Save SKILL.md Changes
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const editor = backdrop.querySelector('#skill-content-editor');
    const validateContent = async () => {
      const content = editor.value;
      try {
        const valRes = await api.validateSkill(content);
        const badge = backdrop.querySelector('#val-badge');
        const statusBox = backdrop.querySelector('#val-status-box');
        const jsonBox = backdrop.querySelector('#val-metadata-json');

        if (valRes.valid) {
          badge.className = 'badge badge-success';
          badge.textContent = 'VALID SPEC';
          statusBox.style.background = 'rgba(16, 185, 129, 0.1)';
          statusBox.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          statusBox.innerHTML = `✅ <strong>Specification Compliant</strong><br>Found valid frontmatter with name <code>${valRes.metadata.name}</code> and detailed instructions.`;
        } else {
          badge.className = 'badge badge-danger';
          badge.textContent = 'SCHEMA ERROR';
          statusBox.style.background = 'rgba(239, 68, 68, 0.1)';
          statusBox.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          statusBox.innerHTML = `⚠️ <strong>Validation Error</strong><br>${valRes.error}`;
        }

        jsonBox.textContent = JSON.stringify(valRes.metadata, null, 2);
      } catch (err) {
        console.error(err);
      }
    };

    validateContent();
    editor?.addEventListener('input', validateContent);

    backdrop.querySelector('#btn-save-skill-content')?.addEventListener('click', async () => {
      const content = editor.value;
      await api.updateSkill(skill.id, { content });
      Toast.success('SKILL.md saved successfully.');
      backdrop.remove();
      await this.loadSkills(container);
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Edit or Create Skill
  openEditModal(skill, container) {
    const isEdit = Boolean(skill);
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const defaultContent = `---
name: my-new-skill
description: Comprehensive workflow skill for executing agentic actions.
---

# New Skill Title

## Workflow Instructions
1. Inspect target resources
2. Execute automated scripts in \`scripts/\`
3. Validate output
`;

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>${isEdit ? '✏️ Edit Skill' : '✨ New Skill (SKILL.md)'}</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Skill Name (Directory identifier) *</label>
              <input type="text" class="form-input" id="skill-name" value="${isEdit ? skill.name : ''}" placeholder="e.g. dataform-bigquery">
            </div>
            <div class="form-group">
              <label class="form-label">Display Title</label>
              <input type="text" class="form-input" id="skill-title" value="${isEdit ? (skill.title || skill.name) : ''}" placeholder="e.g. Dataform BigQuery Pipeline Wizard">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" id="skill-desc" value="${isEdit ? (skill.description || '') : ''}" placeholder="Short summary when this skill triggers">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Required Tools (comma separated)</label>
              <input type="text" class="form-input" id="skill-tools" value="${isEdit ? (skill.tools_required || []).join(', ') : 'view_file, run_command'}" placeholder="view_file, run_command">
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="skill-tags" value="${isEdit ? (skill.tags || []).join(', ') : 'antigravity, skills'}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">SKILL.md Content *</label>
            <textarea class="form-input" id="skill-content" rows="9" style="font-family: var(--font-mono); font-size: 12px;">${isEdit ? skill.content : defaultContent}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Cancel</button>
          <button class="btn btn-primary" id="btn-save-skill">
            <span>💾</span> Save Skill
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('#btn-save-skill')?.addEventListener('click', async () => {
      const name = backdrop.querySelector('#skill-name')?.value.trim();
      const title = backdrop.querySelector('#skill-title')?.value.trim();
      const description = backdrop.querySelector('#skill-desc')?.value.trim();
      const tools_required = (backdrop.querySelector('#skill-tools')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      const tags = (backdrop.querySelector('#skill-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      const content = backdrop.querySelector('#skill-content')?.value;

      if (!name || !content) {
        Toast.error('Name and SKILL.md content are required.');
        return;
      }

      if (isEdit) {
        await api.updateSkill(skill.id, {
          name,
          title,
          description,
          tools_required,
          tags,
          content
        });
        Toast.success('Skill updated successfully.');
      } else {
        await api.createSkill({
          name,
          title,
          description,
          tools_required,
          tags,
          content
        });
        Toast.success('New skill created successfully.');
      }

      backdrop.remove();
      await this.loadSkills(container);
    });

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => backdrop.remove());
    });
  },

  // Modal: Export skill bundle structure
  openExportModal(exportData) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const files = exportData.files || {};
    const fileKeys = Object.keys(files);

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>📦</span>
            <span>Skill Export Manifest: <strong>${exportData.skill_name}</strong></span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">Target Installation Directory:</div>
          <code style="color: #34d399; font-size: 13px; font-family: var(--font-mono);">${exportData.target_path}</code>

          <div style="font-size: 13px; font-weight: 600; margin-top: 16px; margin-bottom: 6px;">Manifest Files:</div>
          ${fileKeys.map(fk => `
            <div style="margin-bottom: 12px;">
              <div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${fk}</div>
              <textarea class="form-input" readonly rows="5" style="font-family: var(--font-mono); font-size: 11px;">${files[fk]}</textarea>
            </div>
          `).join('')}
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
  }
};
