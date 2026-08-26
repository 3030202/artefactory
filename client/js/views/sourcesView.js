import { api } from '../api.js';
import { Toast } from '../components/toast.js';

export const sourcesView = {
  state: {
    sources: [],
    categoryFilter: 'all',
    searchQuery: '',
    viewMode: 'dense', // 'dense' | 'cards'
    selectedSource: null,
    isSyncing: false
  },

  async render(container) {
    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <i data-lucide="book-open"></i>
            <span>Каталог источников и Спецификации</span>
            <span class="badge badge-sources" id="sources-total-badge">10 Направлений</span>
          </div>
          <div class="section-desc">
            Канонические спецификации (MCP, A2A, OpenAPI), гайды промпт-инжиниринга (Anthropic, DSPy), фреймворки оркестрации (LangGraph, CrewAI), рантаймы (llama.cpp, vLLM) и модели угроз (OWASP GenAI).
          </div>
        </div>
        <div class="flex-center gap-sm">
          <button class="btn btn-primary" id="btn-trigger-sync" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: none; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);" title="Динамический сбор и синхронизация артефактов">
            <i data-lucide="refresh-cw" id="sync-btn-icon"></i>
            <span>Live Sync from Sources</span>
          </button>
          <a href="/api/sources/export/active.md" target="_blank" class="btn btn-secondary" title="Export Markdown Registry">
            <i data-lucide="file-text"></i> active.md
          </a>
          <a href="/api/sources/export/all.json" target="_blank" class="btn btn-secondary" title="Export Full JSON Database">
            <i data-lucide="download"></i> all.json
          </a>
          <button class="btn btn-secondary" id="btn-toggle-view">
            <i data-lucide="layout-grid" id="view-icon"></i>
            <span id="view-mode-text">Cards View</span>
          </button>
        </div>
      </div>

      <!-- Category Filter Chips -->
      <div class="category-chips-bar" id="category-chips">
        <button class="chip-btn active" data-cat="all">🌟 Все источники</button>
        <button class="chip-btn" data-cat="specs_protocols">⚡ Спецификации & MCP</button>
        <button class="chip-btn" data-cat="prompt_engineering">🧠 Промпт-инжиниринг</button>
        <button class="chip-btn" data-cat="orchestration">🔄 Оркестрация агентов</button>
        <button class="chip-btn" data-cat="observability_eval">📊 Наблюдаемость & Eval</button>
        <button class="chip-btn" data-cat="local_runtimes">💻 Локальный рантайм</button>
        <button class="chip-btn" data-cat="security_threats">🛡️ Безопасность & OWASP</button>
        <button class="chip-btn" data-cat="tui_ux">📟 TUI & Dense UX</button>
        <button class="chip-btn" data-cat="datasets_hubs">📚 Датасеты промптов</button>
        <button class="chip-btn" data-cat="enterprise_integrations">🏢 Корпоративный контур</button>
        <button class="chip-btn" data-cat="frontier_research">🔬 Исследования 2024–2026</button>
      </div>

      <!-- Filter & Search Bar -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); width: 16px; height: 16px;"></i>
          <input type="text" class="search-input" id="sources-search-input" placeholder="Поиск по источникам, тегам, протоколам (MCP, DSPy, OWASP, vLLM)...">
        </div>
        <div class="text-xs text-secondary font-mono" id="sources-count-display">
          Загрузка источников...
        </div>
      </div>

      <!-- Main Sources Container -->
      <div id="sources-content-container">
        <div class="loading-spinner"></div>
      </div>

      <!-- Modal Mount Point -->
      <div id="sources-modal-container"></div>
    `;

    this.bindEvents(container);
    await this.loadSources(container);
  },

  async loadSources(container) {
    try {
      const res = await api.getSources();
      this.state.sources = res.data || [];
      this.renderContent(container);
    } catch (err) {
      container.querySelector('#sources-content-container').innerHTML = `
        <div class="empty-state">
          <i data-lucide="alert-circle" style="color: var(--status-danger);"></i>
          <h3>Не удалось загрузить каталог источников</h3>
          <p>${err.message}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  },

  renderContent(container) {
    const content = container.querySelector('#sources-content-container');
    const countDisplay = container.querySelector('#sources-count-display');
    const filtered = this.getFilteredSources();

    countDisplay.textContent = `Показано ${filtered.length} из ${this.state.sources.length} источников`;

    if (filtered.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <i data-lucide="book-open"></i>
          <h3>Источники не найдены</h3>
          <p>Попробуйте изменить категорию или поисковый запрос</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (this.state.viewMode === 'dense') {
      this.renderDenseTable(content, filtered);
    } else {
      this.renderCardsGrid(content, filtered);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  getFilteredSources() {
    return this.state.sources.filter(s => {
      const matchCat = this.state.categoryFilter === 'all' || s.category === this.state.categoryFilter;
      const q = this.state.searchQuery.toLowerCase();
      const matchSearch = !q || 
        s.title.toLowerCase().includes(q) ||
        (s.excerpt && s.excerpt.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q))) ||
        (s.author && s.author.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  },

  renderDenseTable(content, items) {
    content.innerHTML = `
      <div class="dense-table-wrapper">
        <table class="dense-table">
          <thead>
            <tr>
              <th style="width: 120px;">ID / Год</th>
              <th>Название источника & Спецификация</th>
              <th>Категория</th>
              <th>Лицензия</th>
              <th>Схема / Протокол</th>
              <th>Tokens</th>
              <th style="text-align: right;">Действия</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(s => `
              <tr>
                <td>
                  <span class="font-mono text-xs text-secondary">${s.id}</span>
                  <div class="badge badge-version" style="font-size: 10px; margin-top: 2px;">${s.year || '2025-2026'}</div>
                  ${s.last_synced_at ? `<div class="badge badge-success" style="font-size: 9px; margin-top: 2px;">Synced</div>` : ''}
                </td>
                <td>
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${s.title}</div>
                  <div class="text-xs text-secondary" style="line-height: 1.4; max-width: 480px;">${s.excerpt || ''}</div>
                  <div class="flex-center gap-xs" style="margin-top: 6px; flex-wrap: wrap;">
                    ${(s.tags || []).slice(0, 5).map(t => `<span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.05);">#${t}</span>`).join('')}
                  </div>
                </td>
                <td>
                  <span class="badge badge-sources">${s.categoryLabel || s.category}</span>
                </td>
                <td>
                  <span class="text-xs font-mono text-secondary">${s.license}</span>
                </td>
                <td>
                  <code class="text-xs" style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; color: var(--theme-color); font-family: var(--font-mono);">
                    ${s.canonical_schema || 'Standard'}
                  </code>
                </td>
                <td>
                  <span class="text-xs text-secondary font-mono">~${s.tokens_est || 1500}</span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <div class="flex-center gap-xs" style="justify-content: flex-end;">
                    <a href="${s.url}" target="_blank" class="btn btn-icon btn-secondary" title="Открыть внешний источник">
                      <i data-lucide="external-link"></i>
                    </a>
                    <button class="btn btn-secondary btn-sm btn-sync-single-source" data-id="${s.id}" title="Синхронизировать этот источник">
                      <i data-lucide="refresh-cw"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm btn-inspect-source" data-id="${s.id}" title="Просмотр деталей">
                      <i data-lucide="eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm btn-convert-source" data-id="${s.id}" title="Преобразовать в рабочий артефакт">
                      <i data-lucide="sparkles"></i> Convert
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderCardsGrid(content, items) {
    content.innerHTML = `
      <div class="cards-grid">
        ${items.map(s => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="card-header" style="align-items: flex-start;">
                <div>
                  <div class="flex-center gap-xs" style="margin-bottom: 6px;">
                    <span class="badge badge-sources">${s.categoryLabel || s.category}</span>
                    ${s.last_synced_at ? `<span class="badge badge-success" style="font-size: 9px;">Synced</span>` : ''}
                  </div>
                  <h3 class="card-title" style="font-size: 15px; line-height: 1.3;">${s.title}</h3>
                  <div class="text-xs text-tertiary" style="margin-top: 2px;">Автор: ${s.author || 'Open Source'} • ${s.year || '2025-2026'}</div>
                </div>
              </div>
              <div class="card-body" style="padding: 12px 0;">
                <p class="card-desc" style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 12px;">
                  ${s.excerpt}
                </p>
                <div class="text-xs font-mono" style="background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-subtle); margin-bottom: 12px;">
                  <span style="color: var(--text-tertiary);">Схема: </span>
                  <span style="color: var(--theme-color); font-weight: 500;">${s.canonical_schema || 'Standard Protocol'}</span>
                </div>
                <div class="flex-center gap-xs" style="flex-wrap: wrap;">
                  ${(s.tags || []).map(t => `<span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.05);">#${t}</span>`).join('')}
                </div>
              </div>
            </div>
            <div class="card-footer flex-center" style="justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 8px;">
              <span class="text-xs font-mono text-tertiary">~${s.tokens_est || 1500} токенов</span>
              <div class="flex-center gap-xs">
                <a href="${s.url}" target="_blank" class="btn btn-icon btn-secondary" title="Открыть внешний источник">
                  <i data-lucide="external-link"></i>
                </a>
                <button class="btn btn-secondary btn-sm btn-sync-single-source" data-id="${s.id}" title="Синхронизировать">
                  <i data-lucide="refresh-cw"></i>
                </button>
                <button class="btn btn-secondary btn-sm btn-inspect-source" data-id="${s.id}">
                  Инфо
                </button>
                <button class="btn btn-primary btn-sm btn-convert-source" data-id="${s.id}">
                  <i data-lucide="sparkles"></i> Convert
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  bindEvents(container) {
    // Search input
    const searchInput = container.querySelector('#sources-search-input');
    searchInput.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value;
      this.renderContent(container);
    });

    // View toggle button
    const toggleBtn = container.querySelector('#btn-toggle-view');
    const viewText = container.querySelector('#view-mode-text');
    const viewIcon = container.querySelector('#view-icon');
    toggleBtn.addEventListener('click', () => {
      if (this.state.viewMode === 'dense') {
        this.state.viewMode = 'cards';
        viewText.textContent = 'Dense View';
        viewIcon.setAttribute('data-lucide', 'list');
      } else {
        this.state.viewMode = 'dense';
        viewText.textContent = 'Cards View';
        viewIcon.setAttribute('data-lucide', 'layout-grid');
      }
      this.renderContent(container);
    });

    // Dynamic Live Sync Trigger button
    const syncBtn = container.querySelector('#btn-trigger-sync');
    syncBtn.addEventListener('click', () => {
      this.openSyncModal(container);
    });

    // Category chips
    const chipBtns = container.querySelectorAll('.chip-btn');
    chipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chipBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.categoryFilter = btn.getAttribute('data-cat');
        this.renderContent(container);
      });
    });

    // Delegate click events for inspect, convert & single sync buttons
    container.addEventListener('click', async (e) => {
      const inspectBtn = e.target.closest('.btn-inspect-source');
      if (inspectBtn) {
        const id = inspectBtn.getAttribute('data-id');
        this.openInspectModal(id);
        return;
      }

      const convertBtn = e.target.closest('.btn-convert-source');
      if (convertBtn) {
        const id = convertBtn.getAttribute('data-id');
        this.openConvertModal(id);
        return;
      }

      const syncSingleBtn = e.target.closest('.btn-sync-single-source');
      if (syncSingleBtn) {
        const id = syncSingleBtn.getAttribute('data-id');
        await this.syncSingleSource(id, container);
        return;
      }
    });
  },

  async syncSingleSource(id, container) {
    try {
      Toast.info(`Синхронизация источника ${id}...`);
      const res = await api.syncSource(id);
      Toast.success(`Источник успешно синхронизирован! Новых: +${res.result.created.prompts + res.result.created.skills + res.result.created.workflows + res.result.created.mcp_servers + res.result.created.rules}`);
      await this.loadSources(container);
      if (window.appRouter) window.appRouter.updateStatsCounters();
    } catch (err) {
      Toast.error(err.message || 'Ошибка синхронизации источника');
    }
  },

  // Open Full Dynamic Ingestion Progress Dialog
  openSyncModal(pageContainer) {
    const modalRoot = document.getElementById('sources-modal-container');
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="sync-modal-backdrop">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="flex-center gap-sm">
              <i data-lucide="refresh-cw" class="spin-animation" style="color: var(--theme-color);"></i>
              <h3 class="modal-title">Dynamic Ingestion & Harvesting Engine</h3>
            </div>
            <button class="modal-close" id="btn-sync-close"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <p class="text-sm text-secondary">
              Запуск динамического сбора спецификаций, промпт-шаблонов, графов LangGraph, MCP-серверов и гардрайлов безопасности из канонических источников.
            </p>

            <div class="sync-progress-bar-track">
              <div class="sync-progress-bar-fill" id="sync-progress-fill"></div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
              <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); padding: 8px; border-radius: 6px; text-align: center;">
                <div class="text-xs text-secondary">🟣 Prompts</div>
                <div id="stat-sync-prompts" style="font-weight: 700; font-size: 16px; color: #c084fc;">+0</div>
              </div>
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px; border-radius: 6px; text-align: center;">
                <div class="text-xs text-secondary">🟢 Skills</div>
                <div id="stat-sync-skills" style="font-weight: 700; font-size: 16px; color: #34d399;">+0</div>
              </div>
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 8px; border-radius: 6px; text-align: center;">
                <div class="text-xs text-secondary">🟡 Workflows</div>
                <div id="stat-sync-workflows" style="font-weight: 700; font-size: 16px; color: #fbbf24;">+0</div>
              </div>
              <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); padding: 8px; border-radius: 6px; text-align: center;">
                <div class="text-xs text-secondary">🌐 MCP Servers</div>
                <div id="stat-sync-mcp" style="font-weight: 700; font-size: 16px; color: #22d3ee;">+0</div>
              </div>
              <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); padding: 8px; border-radius: 6px; text-align: center;">
                <div class="text-xs text-secondary">🔴 Rules</div>
                <div id="stat-sync-rules" style="font-weight: 700; font-size: 16px; color: #fb7185;">+0</div>
              </div>
            </div>

            <div class="sync-terminal" id="sync-terminal-output">
              <div class="sync-terminal-line info">[INIT] Engine ready. Starting live discovery...</div>
            </div>
          </div>
          <div class="modal-footer flex-center" style="justify-content: space-between;">
            <span class="text-xs text-tertiary font-mono" id="sync-status-msg">Выполняется синхронизация...</span>
            <button class="btn btn-primary" id="btn-sync-done" disabled>
              Завершить
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => { modalRoot.innerHTML = ''; };
    modalRoot.querySelector('#btn-sync-close').addEventListener('click', closeModal);
    modalRoot.querySelector('#btn-sync-done').addEventListener('click', () => {
      closeModal();
      this.loadSources(pageContainer);
      if (window.appRouter) window.appRouter.updateStatsCounters();
    });

    const terminal = modalRoot.querySelector('#sync-terminal-output');
    const progressFill = modalRoot.querySelector('#sync-progress-fill');
    const doneBtn = modalRoot.querySelector('#btn-sync-done');
    const statusMsg = modalRoot.querySelector('#sync-status-msg');

    // Run dynamic sync
    setTimeout(async () => {
      try {
        progressFill.style.width = '30%';
        const res = await api.syncSources();
        const report = res.report || {};
        const logs = report.logs || [];
        const totals = report.totals || {};

        progressFill.style.width = '80%';
        terminal.innerHTML = logs.map(l => {
          let cls = 'info';
          if (l.includes('[OK]') || l.includes('✅')) cls = 'success';
          if (l.includes('[WARN]')) cls = 'warning';
          return `<div class="sync-terminal-line ${cls}">${l}</div>`;
        }).join('');
        terminal.scrollTop = terminal.scrollHeight;

        modalRoot.querySelector('#stat-sync-prompts').textContent = `+${totals.prompts_created || 0}`;
        modalRoot.querySelector('#stat-sync-skills').textContent = `+${totals.skills_created || 0}`;
        modalRoot.querySelector('#stat-sync-workflows').textContent = `+${totals.workflows_created || 0}`;
        modalRoot.querySelector('#stat-sync-mcp').textContent = `+${totals.mcp_created || 0}`;
        modalRoot.querySelector('#stat-sync-rules').textContent = `+${totals.rules_created || 0}`;

        progressFill.style.width = '100%';
        statusMsg.textContent = `Синхронизация завершена за ${totals.duration_ms || 0}ms!`;
        doneBtn.removeAttribute('disabled');
        doneBtn.classList.add('btn-success');
        Toast.success('Динамический сбор артефактов успешно завершен!');
      } catch (err) {
        progressFill.style.background = 'var(--status-danger)';
        terminal.innerHTML += `<div class="sync-terminal-line warning">[ERROR] ${err.message}</div>`;
        statusMsg.textContent = 'Ошибка синхронизации';
        doneBtn.removeAttribute('disabled');
      }
    }, 400);
  },

  openInspectModal(id) {
    const source = this.state.sources.find(s => s.id === id);
    if (!source) return;

    const modalRoot = document.getElementById('sources-modal-container');
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="flex-center gap-sm">
              <i data-lucide="book-open" style="color: var(--theme-color);"></i>
              <h3 class="modal-title">${source.title}</h3>
            </div>
            <button class="modal-close" id="btn-modal-close"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="flex-center gap-sm" style="flex-wrap: wrap;">
              <span class="badge badge-sources">${source.categoryLabel || source.category}</span>
              <span class="badge badge-version">${source.year || '2025-2026'}</span>
              <span class="badge badge-version">Лицензия: ${source.license}</span>
              <span class="badge badge-version">Оценка токенов: ~${source.tokens_est}</span>
              ${source.last_synced_at ? `<span class="badge badge-success">Last Synced: ${new Date(source.last_synced_at).toLocaleTimeString()}</span>` : ''}
            </div>

            <div>
              <label class="form-label">Описание и канонический протокол</label>
              <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); line-height: 1.6; color: var(--text-primary); font-size: 14px;">
                ${source.excerpt}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label">Схема контракта</label>
                <code style="display: block; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-size: 12px; color: var(--theme-color);">
                  ${source.canonical_schema || 'JSON Schema 2020-12 / Markdown'}
                </code>
              </div>
              <div>
                <label class="form-label">Авторство & Репозиторий</label>
                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-size: 12px; color: var(--text-secondary);">
                  ${source.author || 'Open Source'}<br>
                  <a href="${source.url}" target="_blank" style="color: var(--theme-color); text-decoration: underline;">${source.url}</a>
                </div>
              </div>
            </div>

            <div>
              <label class="form-label">Теги источника</label>
              <div class="flex-center gap-xs" style="flex-wrap: wrap;">
                ${(source.tags || []).map(t => `<span class="badge badge-prompts">#${t}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="modal-footer flex-center" style="justify-content: space-between;">
            <a href="${source.url}" target="_blank" class="btn btn-secondary">
              <i data-lucide="external-link"></i> Открыть первоисточник
            </a>
            <div class="flex-center gap-sm">
              <button class="btn btn-secondary" id="btn-modal-cancel">Закрыть</button>
              <button class="btn btn-primary" id="btn-modal-convert" data-id="${source.id}">
                <i data-lucide="sparkles"></i> Convert to Artifact
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => { modalRoot.innerHTML = ''; };
    modalRoot.querySelector('#btn-modal-close').addEventListener('click', closeModal);
    modalRoot.querySelector('#btn-modal-cancel').addEventListener('click', closeModal);
    modalRoot.querySelector('#modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') closeModal();
    });

    modalRoot.querySelector('#btn-modal-convert').addEventListener('click', () => {
      closeModal();
      this.openConvertModal(source.id);
    });
  },

  openConvertModal(id) {
    const source = this.state.sources.find(s => s.id === id);
    if (!source) return;

    const modalRoot = document.getElementById('sources-modal-container');
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="convert-modal-backdrop">
        <div class="modal">
          <div class="modal-header">
            <div class="flex-center gap-sm">
              <i data-lucide="sparkles" style="color: var(--theme-color);"></i>
              <h3 class="modal-title">Конвертировать источник в артефакт</h3>
            </div>
            <button class="modal-close" id="btn-convert-close"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
            <p class="text-sm text-secondary">
              Создать готовый рабочий артефакт на основе спецификации: <strong style="color: var(--text-primary);">${source.title}</strong>
            </p>

            <div class="form-group">
              <label class="form-label">Выберите целевой реестр артефакта:</label>
              <select class="form-select" id="convert-target-type" style="padding: 10px; font-size: 13px;">
                <option value="prompts">🟣 Промпт-шаблон (Prompts Studio)</option>
                <option value="skills">🟢 Навык агента (Skills Registry SKILL.md)</option>
                <option value="workflows">🟡 Пайплайн DAG (Workflows Runner)</option>
                <option value="mcp_servers">🌐 Сервер MCP (Model Context Protocol)</option>
                <option value="rules">🔴 Правило / Директива (AGENTS.md Guardrail)</option>
              </select>
            </div>

            <div class="text-xs text-tertiary" style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-subtle);">
              ℹ️ Артефакт будет автоматически зарегистрирован в базе данных, получит семантический версионинг v1.0.0 и станет доступен в соответствующем разделе Control Tower.
            </div>
          </div>
          <div class="modal-footer flex-center" style="justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary" id="btn-convert-cancel">Отмена</button>
            <button class="btn btn-primary" id="btn-convert-submit">
              <i data-lucide="check"></i> Сгенерировать артефакт
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => { modalRoot.innerHTML = ''; };
    modalRoot.querySelector('#btn-convert-close').addEventListener('click', closeModal);
    modalRoot.querySelector('#btn-convert-cancel').addEventListener('click', closeModal);
    modalRoot.querySelector('#convert-modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'convert-modal-backdrop') closeModal();
    });

    modalRoot.querySelector('#btn-convert-submit').addEventListener('click', async () => {
      const targetType = modalRoot.querySelector('#convert-target-type').value;
      try {
        const res = await api.convertSource(source.id, targetType);
        Toast.success(res.message || 'Артефакт успешно создан!');
        closeModal();
        if (targetType === 'mcp_servers') window.location.hash = '#mcp';
        else window.location.hash = `#${targetType}`;
      } catch (err) {
        Toast.error(err.message || 'Ошибка конвертации');
      }
    });
  }
};
