import { api } from './api.js';
import { Toast } from './components/toast.js';
import { dashboardView } from './views/dashboardView.js';
import { sourcesView } from './views/sourcesView.js';
import { promptsView } from './views/promptsView.js';
import { skillsView } from './views/skillsView.js';
import { workflowsView } from './views/workflowsView.js';
import { mcpView } from './views/mcpView.js';
import { rulesView } from './views/rulesView.js';
import { gitopsView } from './views/gitopsView.js';
import { tuiEngine } from './tui/tui_engine.js';
import { Icons } from './components/icons.js';
import { RuntimeWidget } from './components/runtimeWidget.js';
import { GitStatusBar } from './components/gitStatusBar.js';

class AppRouter {
  constructor() {
    this.routes = {
      dashboard: dashboardView,
      sources: sourcesView,
      gitops: gitopsView,
      prompts: promptsView,
      skills: skillsView,
      workflows: workflowsView,
      mcp: mcpView,
      rules: rulesView
    };
    this.currentRoute = 'dashboard';
    this.container = document.getElementById('page-content');
    this.sidebar = document.getElementById('main-sidebar');
    this.drawerBackdrop = document.getElementById('mobile-drawer-backdrop');
    this.init();
  }

  hydrateIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      const iconName = el.getAttribute('data-icon');
      if (Icons[iconName]) {
        el.innerHTML = Icons[iconName](el.classList.contains('dock-icon') ? 20 : 18);
      }
    });
  }

  init() {
    this.hydrateIcons();
    RuntimeWidget.init();
    GitStatusBar.init();

    // Desktop & Drawer Navigation items click
    document.querySelectorAll('.nav-item[data-route]').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.getAttribute('data-route');
        this.navigate(route);
        this.closeMobileDrawer();
      });
    });

    // Mobile Bottom Dock items click
    document.querySelectorAll('.dock-item[data-route]').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.getAttribute('data-route');
        this.navigate(route);
      });
    });

    // Mobile Bottom Dock "More" button click
    document.getElementById('btn-dock-more')?.addEventListener('click', () => {
      this.openMobileMoreSheet();
    });

    // Mobile Hamburger Toggle & Close Button
    document.getElementById('btn-toggle-mobile-menu')?.addEventListener('click', () => {
      this.toggleMobileDrawer();
    });

    document.getElementById('btn-close-mobile-drawer')?.addEventListener('click', () => {
      this.closeMobileDrawer();
    });

    // Mobile Drawer Backdrop click
    this.drawerBackdrop?.addEventListener('click', () => {
      this.closeMobileDrawer();
    });

    // Brand click -> dashboard
    document.getElementById('brand-btn')?.addEventListener('click', () => {
      this.navigate('dashboard');
      this.closeMobileDrawer();
    });

    document.getElementById('mobile-brand-btn')?.addEventListener('click', () => {
      this.navigate('dashboard');
      this.closeMobileDrawer();
    });

    // TUI Mode Toggle buttons
    document.getElementById('btn-toggle-tui-desktop')?.addEventListener('click', () => {
      tuiEngine.toggle();
    });
    document.getElementById('btn-toggle-tui-mobile')?.addEventListener('click', () => {
      tuiEngine.toggle();
    });

    // Global Omni-Search Modal handlers (Desktop & Mobile)
    document.getElementById('header-search-btn')?.addEventListener('click', () => this.openOmniSearch());
    document.getElementById('mobile-header-search-btn')?.addEventListener('click', () => this.openOmniSearch());

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openOmniSearch();
      }
    });

    // Initial route from URL hash or default
    const initial = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(initial);
    this.updateStatsCounters();

    // Check if user preferred TUI mode
    if (localStorage.getItem('artefactory_view_mode') === 'tui') {
      tuiEngine.activate();
    }
  }

  openMobileMoreSheet() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>${Icons.more(18)}</span>
            <span>All Registries & Tools</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body" style="gap: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="artifact-card" data-more-route="sources" style="padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <span style="color: var(--cat-sources, #3b82f6);">${Icons.sources(20)}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700;">Sources & Specs</div>
                <div style="font-size: 11px; color: var(--text-muted);">21 specs</div>
              </div>
            </div>

            <div class="artifact-card" data-more-route="skills" style="padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <span style="color: var(--cat-skills, #10b981);">${Icons.skills(20)}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700;">Skills Registry</div>
                <div style="font-size: 11px; color: var(--text-muted);">SKILL.md</div>
              </div>
            </div>

            <div class="artifact-card" data-more-route="mcp" style="padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <span style="color: var(--cat-mcp, #06b6d4);">${Icons.mcp(20)}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700;">MCP Servers</div>
                <div style="font-size: 11px; color: var(--text-muted);">JSON-RPC</div>
              </div>
            </div>

            <div class="artifact-card" data-more-route="rules" style="padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <span style="color: var(--cat-rules, #f43f5e);">${Icons.rules(20)}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700;">Rules & Policies</div>
                <div style="font-size: 11px; color: var(--text-muted);">AGENTS.md</div>
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); margin-top: 6px; padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary" id="btn-more-tui" style="justify-content: flex-start; gap: 10px; padding: 10px;">
              <span>${Icons.terminal(18)}</span>
              <span>Switch to Dense TUI Mode (8.0x101)</span>
            </button>
            <button class="btn btn-secondary" id="btn-more-telemetry" style="justify-content: flex-start; gap: 10px; padding: 10px;">
              <span>${Icons.server(18)}</span>
              <span>Docker Runtime Telemetry & Health</span>
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    backdrop.querySelectorAll('[data-more-route]').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.getAttribute('data-more-route');
        backdrop.remove();
        this.navigate(route);
      });
    });

    backdrop.querySelector('#btn-more-tui')?.addEventListener('click', () => {
      backdrop.remove();
      tuiEngine.activate();
    });

    backdrop.querySelector('#btn-more-telemetry')?.addEventListener('click', () => {
      backdrop.remove();
      RuntimeWidget.openTelemetryModal();
    });
  }

  toggleMobileDrawer() {
    if (this.sidebar?.classList.contains('open')) {
      this.closeMobileDrawer();
    } else {
      this.openMobileDrawer();
    }
  }

  openMobileDrawer() {
    this.sidebar?.classList.add('open');
    this.drawerBackdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeMobileDrawer() {
    this.sidebar?.classList.remove('open');
    this.drawerBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  async updateStatsCounters() {
    try {
      const res = await api.getStats();
      const stats = res.data || {};
      const setCnt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || 0;
      };
      setCnt('cnt-sources', stats.sources_count);
      setCnt('cnt-prompts', stats.prompts_count);
      setCnt('cnt-skills', stats.skills_count);
      setCnt('cnt-workflows', stats.workflows_count);
      setCnt('cnt-mcp', stats.mcp_servers_count);
      setCnt('cnt-rules', stats.rules_count);
    } catch (err) {
      console.warn('Could not fetch counter stats:', err);
    }
  }

  navigate(route) {
    if (!this.routes[route]) route = 'dashboard';
    this.currentRoute = route;
    window.location.hash = route;

    // Update active nav class in desktop sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active dock item in mobile floating dock
    document.querySelectorAll('.dock-item').forEach(item => {
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Set Theme on body and root
    document.body.setAttribute('data-theme', route);
    const root = document.getElementById('app-root');
    if (root) root.setAttribute('data-theme', route);

    // Update Breadcrumb
    const bc = document.getElementById('breadcrumb-current');
    if (bc) {
      const labels = {
        dashboard: 'Dashboard',
        sources: 'Sources & Specs',
        gitops: 'GitOps & Sync Hub',
        prompts: 'Prompts Studio',
        skills: 'Skills Registry',
        workflows: 'Workflows (DAG)',
        mcp: 'MCP Servers',
        rules: 'Rules & Guardrails'
      };
      bc.textContent = labels[route] || route;
    }

    // Render View
    if (this.container) {
      this.routes[route].render(this.container, this);
    }

    this.hydrateIcons();
    this.updateStatsCounters();
  }

  refresh() {
    this.navigate(this.currentRoute);
  }

  // Ctrl+K Omni-Search Modal
  openOmniSearch() {
    const existing = document.getElementById('omni-modal');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'omni-backdrop';
    backdrop.id = 'omni-modal';
    backdrop.innerHTML = `
      <div class="omni-dialog">
        <div class="modal-drag-handle"></div>
        <div class="omni-input-bar">
          <span style="font-size: 18px;">🔍</span>
          <input type="text" class="omni-search-input" id="omni-query" placeholder="Поиск по смыслу или ключевым словам (Ctrl+K)..." autofocus>
          <span class="omni-kbd">ESC</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 14px; border-bottom: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2);">
          <div class="omni-filter-chips" style="border: none; padding: 0;">
            <button class="omni-filter active" data-cat="all">All</button>
            <button class="omni-filter" data-cat="sources">Sources</button>
            <button class="omni-filter" data-cat="prompts">Prompts</button>
            <button class="omni-filter" data-cat="skills">Skills</button>
            <button class="omni-filter" data-cat="workflows">Workflows</button>
            <button class="omni-filter" data-cat="mcp_servers">MCP</button>
            <button class="omni-filter" data-cat="rules">Rules</button>
          </div>
          <button id="btn-toggle-search-mode" class="badge badge-prompts" style="cursor: pointer; padding: 4px 8px; font-size: 11px;">
            <span>🧠 Semantic Mode</span>
          </button>
        </div>
        <div class="omni-results-list" id="omni-results">
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Введите запрос (например: <em>защита от инъекций</em>, <em>многоагентный роутер</em>, <em>mcp github</em>)...</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#omni-query');
    const resultsContainer = backdrop.querySelector('#omni-results');
    const modeBtn = backdrop.querySelector('#btn-toggle-search-mode');
    let currentCat = 'all';
    let isSemanticMode = true;

    modeBtn.addEventListener('click', () => {
      isSemanticMode = !isSemanticMode;
      modeBtn.innerHTML = isSemanticMode ? '<span>🧠 Semantic Mode</span>' : '<span>🔤 Keyword Mode</span>';
      modeBtn.className = isSemanticMode ? 'badge badge-prompts' : 'badge badge-version';
      doSearch();
    });

    input.focus();

    const doSearch = async () => {
      const q = input.value.trim();
      if (!q) {
        resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Введите поисковый запрос...</div>`;
        return;
      }

      try {
        let results = [];
        if (isSemanticMode) {
          const res = await api.searchSemantic({ q, category: currentCat, limit: 10 });
          results = res.results || [];
        } else {
          const res = await api.omniSearch(q, currentCat);
          results = res.results || [];
        }

        if (results.length === 0) {
          resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Ничего не найдено по запросу "${q}"</div>`;
          return;
        }

        resultsContainer.innerHTML = results.map((r, i) => `
          <div class="omni-result-item ${i === 0 ? 'selected' : ''}" data-cat="${r.category}" data-id="${r.id}">
            <div style="font-size: 20px;">
              ${r.category === 'sources' ? '📚' : (r.category === 'prompts' ? '🟣' : (r.category === 'skills' ? '🟢' : (r.category === 'workflows' ? '🟡' : (r.category === 'mcp_servers' ? '🌐' : '🔴'))))}
            </div>
            <div class="omni-result-info">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="omni-result-title">${r.title}</span>
                <span class="badge badge-version">${r.typeLabel}</span>
                ${r.relevancePercent ? `<span class="badge badge-success" style="font-size: 10px;">🎯 ${r.relevancePercent}% Match</span>` : ''}
                ${r.version ? `<span class="badge badge-version">v${r.version}</span>` : ''}
              </div>
              <div class="omni-result-desc">${r.description || ''}</div>
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">Jump ↵</span>
          </div>
        `).join('');

        // Item click
        backdrop.querySelectorAll('.omni-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const cat = item.getAttribute('data-cat');
            backdrop.remove();
            let targetRoute = cat;
            if (cat === 'mcp_servers') targetRoute = 'mcp';
            this.navigate(targetRoute);
          });
        });
      } catch (err) {
        console.error(err);
      }
    };

    input.addEventListener('input', doSearch);

    backdrop.querySelectorAll('.omni-filter').forEach(f => {
      f.addEventListener('click', () => {
        backdrop.querySelectorAll('.omni-filter').forEach(i => i.classList.remove('active'));
        f.classList.add('active');
        currentCat = f.getAttribute('data-cat');
        doSearch();
      });
    });

    // Close on ESC or backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    window.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        backdrop.remove();
        window.removeEventListener('keydown', escHandler);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
});
