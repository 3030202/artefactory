import { api } from './api.js';
import { Toast } from './components/toast.js';
import { dashboardView } from './views/dashboardView.js';
import { promptsView } from './views/promptsView.js';
import { skillsView } from './views/skillsView.js';
import { workflowsView } from './views/workflowsView.js';
import { mcpView } from './views/mcpView.js';
import { rulesView } from './views/rulesView.js';

class AppRouter {
  constructor() {
    this.routes = {
      dashboard: dashboardView,
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

  // Omni-Search Floating Modal
  openOmniSearch() {
    const existing = document.querySelector('.omni-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop omni-modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window omni-modal">
        <div class="omni-search-header">
          <span style="font-size: 18px; color: var(--theme-color);">🔍</span>
          <input type="text" class="omni-search-input" id="omni-input" placeholder="Поиск по всем реестрам (Промпты, Скиллы, DAG, MCP, Правила)..." autofocus>
          <span class="shortcut-badge">ESC to close</span>
        </div>
        <div style="padding: 8px 14px; background: rgba(0,0,0,0.2); display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle);">
          <div class="tag-chip active omni-filter" data-cat="all">All</div>
          <div class="tag-chip omni-filter" data-cat="prompts">Prompts</div>
          <div class="tag-chip omni-filter" data-cat="skills">Skills</div>
          <div class="tag-chip omni-filter" data-cat="workflows">Workflows</div>
          <div class="tag-chip omni-filter" data-cat="mcp_servers">MCP</div>
          <div class="tag-chip omni-filter" data-cat="rules">Rules</div>
        </div>
        <div class="omni-results-list" id="omni-results">
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
            Введите поисковый запрос...
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#omni-input');
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
              ${r.category === 'prompts' ? '🟣' : (r.category === 'skills' ? '🟢' : (r.category === 'workflows' ? '🟡' : (r.category === 'mcp_servers' ? '🌐' : '🔴')))}
            </div>
            <div class="omni-result-info">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="omni-result-title">${r.title}</span>
                <span class="badge badge-version">${r.typeLabel}</span>
                <span class="badge badge-version">v${r.version || '1.0'}</span>
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
