import { api } from './api.js';
import { Toast } from './components/toast.js';
import { dashboardView } from './views/dashboardView.js';
import { sourcesView } from './views/sourcesView.js';
import { promptsView } from './views/promptsView.js';
import { skillsView } from './views/skillsView.js';
import { workflowsView } from './views/workflowsView.js';
import { mcpView } from './views/mcpView.js';
import { rulesView } from './views/rulesView.js';

class AppRouter {
  constructor() {
    this.routes = {
      dashboard: dashboardView,
      sources: sourcesView,
      prompts: promptsView,
      skills: skillsView,
      workflows: workflowsView,
      mcp: mcpView,
      rules: rulesView
    };
    this.currentRoute = 'dashboard';
    this.container = document.getElementById('page-content');
    this.init();
  }

  init() {
    // Navigation items click
    document.querySelectorAll('.nav-item[data-route]').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.getAttribute('data-route');
        this.navigate(route);
      });
    });

    // Brand click -> dashboard
    document.getElementById('brand-btn')?.addEventListener('click', () => {
      this.navigate('dashboard');
    });

    // Global Omni-Search Modal handlers
    const searchBtn = document.getElementById('header-search-btn');
    searchBtn?.addEventListener('click', () => this.openOmniSearch());

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

    // Update active nav class
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Set Theme on body and root
    document.body.setAttribute('data-theme', route);
    document.getElementById('app-root')?.setAttribute('data-theme', route);

    // Render View
    if (this.container) {
      this.routes[route].render(this.container, this);
    }

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
        <div class="omni-input-bar">
          <i data-lucide="search" style="color: var(--theme-color, #6366f1); width: 20px; height: 20px;"></i>
          <input type="text" class="omni-search-input" id="omni-query" placeholder="Глобальный поиск по реестрам, источникам, промптам (Ctrl+K)..." autofocus>
          <span class="omni-kbd">ESC</span>
        </div>
        <div class="omni-filter-chips">
          <button class="omni-filter active" data-cat="all">All</button>
          <button class="omni-filter" data-cat="sources">Sources</button>
          <button class="omni-filter" data-cat="prompts">Prompts</button>
          <button class="omni-filter" data-cat="skills">Skills</button>
          <button class="omni-filter" data-cat="workflows">Workflows</button>
          <button class="omni-filter" data-cat="mcp_servers">MCP</button>
          <button class="omni-filter" data-cat="rules">Rules</button>
        </div>
        <div class="omni-results-list" id="omni-results">
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Введите поисковый запрос (например: MCP, architecture, security, langgraph)...</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    if (window.lucide) window.lucide.createIcons();

    const input = backdrop.querySelector('#omni-query');
    const resultsContainer = backdrop.querySelector('#omni-results');
    let currentCat = 'all';

    input.focus();

    const doSearch = async () => {
      const q = input.value.trim();
      if (!q) {
        resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Введите поисковый запрос...</div>`;
        return;
      }

      try {
        const res = await api.omniSearch(q, currentCat);
        const results = res.results || [];

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
