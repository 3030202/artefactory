import { api } from '../api.js';
import { Toast } from '../components/toast.js';

export class TUIEngine {
  constructor() {
    this.root = null;
    this.isActive = false;
    this.tabs = ['DASH', 'SOURCES', 'PROMPTS', 'SKILLS', 'WORKFLOWS', 'MCP', 'RULES', 'GITOPS'];
    this.activeTab = 2; // Default to PROMPTS
    this.selectedIndex = 0;
    this.searchFilter = '';
    this.mode = 'NORMAL'; // NORMAL | SEARCH | COMMAND | HELP
    this.theme = localStorage.getItem('artefactory_tui_theme') || 'amber';
    this.themesList = ['amber', 'green', 'cyan', 'magenta', 'mono'];
    
    this.cache = {
      sources: [],
      prompts: [],
      skills: [],
      workflows: [],
      mcp_servers: [],
      rules: [],
      gitops: null,
      stats: null
    };

    this.initDOM();
    this.initKeyListeners();
  }

  initDOM() {
    let tuiContainer = document.getElementById('tui-root');
    if (!tuiContainer) {
      tuiContainer = document.createElement('div');
      tuiContainer.id = 'tui-root';
      document.body.appendChild(tuiContainer);
    }
    this.root = tuiContainer;
    this.root.setAttribute('data-tui-theme', this.theme);
  }

  async activate() {
    this.isActive = true;
    this.root.classList.add('active');
    document.body.style.overflow = 'hidden';
    localStorage.setItem('artefactory_view_mode', 'tui');
    await this.fetchAllData();
    this.render();
  }

  deactivate() {
    this.isActive = false;
    this.root.classList.remove('active');
    document.body.style.overflow = '';
    localStorage.setItem('artefactory_view_mode', 'gui');
    if (window.appRouter) window.appRouter.renderCurrentRoute();
  }

  toggle() {
    if (this.isActive) this.deactivate();
    else this.activate();
  }

  setTheme(themeName) {
    if (!this.themesList.includes(themeName)) return;
    this.theme = themeName;
    this.root.setAttribute('data-tui-theme', themeName);
    localStorage.setItem('artefactory_tui_theme', themeName);
    Toast.success(`TUI Theme: ${themeName.toUpperCase()}`);
    this.render();
  }

  cycleTheme() {
    const nextIdx = (this.themesList.indexOf(this.theme) + 1) % this.themesList.length;
    this.setTheme(this.themesList[nextIdx]);
  }

  async fetchAllData() {
    try {
      const [promptsRes, skillsRes, wfRes, mcpRes, rulesRes, srcRes, gitRes, statsRes] = await Promise.all([
        api.getPrompts(),
        api.getSkills(),
        api.getWorkflows(),
        api.getMcpServers(),
        api.getRules(),
        api.getSources(),
        api.getGitOpsStatus(),
        api.getStats()
      ]);

      this.cache.prompts = promptsRes.data || [];
      this.cache.skills = skillsRes.data || [];
      this.cache.workflows = wfRes.data || [];
      this.cache.mcp_servers = mcpRes.data || [];
      this.cache.rules = rulesRes.data || [];
      this.cache.sources = srcRes.data || [];
      this.cache.gitops = gitRes.data || {};
      this.cache.stats = statsRes.data || {};
    } catch (err) {
      console.error('[TUI] Data fetch error:', err);
    }
  }

  getCurrentItems() {
    let items = [];
    const tabName = this.tabs[this.activeTab];

    if (tabName === 'SOURCES') items = this.cache.sources;
    else if (tabName === 'PROMPTS') items = this.cache.prompts;
    else if (tabName === 'SKILLS') items = this.cache.skills;
    else if (tabName === 'WORKFLOWS') items = this.cache.workflows;
    else if (tabName === 'MCP') items = this.cache.mcp_servers;
    else if (tabName === 'RULES') items = this.cache.rules;
    else if (tabName === 'GITOPS') items = this.cache.gitops?.modified_files?.map(f => ({ id: f, title: f, category: 'gitops' })) || [];

    if (!this.searchFilter) return items;

    const q = this.searchFilter.toLowerCase();
    return items.filter(it => 
      (it.id && it.id.toLowerCase().includes(q)) ||
      (it.title && it.title.toLowerCase().includes(q)) ||
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      (it.tags && it.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  render() {
    if (!this.isActive) return;

    const currentItems = this.getCurrentItems();
    if (this.selectedIndex >= currentItems.length) {
      this.selectedIndex = Math.max(0, currentItems.length - 1);
    }

    const currentItem = currentItems[this.selectedIndex] || null;
    const tabName = this.tabs[this.activeTab];

    this.root.innerHTML = `
      <!-- Top Navigation Tabs Bar -->
      <div class="tui-top-bar">
        <div class="tui-tabs">
          <span style="font-weight: 800; color: var(--tui-accent); margin-right: 4px;">⬡ ARTEFACTORY [TUI]</span>
          ${this.tabs.map((tab, idx) => `
            <div class="tui-tab ${idx === this.activeTab ? 'active' : ''}" data-idx="${idx}">
              [${idx + 1}] ${tab}
            </div>
          `).join('')}
        </div>

        <div class="tui-top-actions">
          <span class="tui-item-meta">Theme: <strong>${this.theme.toUpperCase()}</strong></span>
          <button class="tui-btn-action" id="tui-btn-help">[?] HELP</button>
          <button class="tui-btn-action" id="tui-btn-gui">[GUI: Alt+T]</button>
        </div>
      </div>

      <!-- Main Dual-Pane Area -->
      <div class="tui-main-split">
        <!-- Left Pane: Items Index -->
        <div class="tui-left-pane">
          <div class="tui-pane-header">
            <span>INDEX: ${tabName} (${currentItems.length})</span>
            <span>${this.searchFilter ? `FILTER: /${this.searchFilter}` : 'ALL'}</span>
          </div>

          <div class="tui-items-list" id="tui-items-list">
            ${tabName === 'DASH' ? this.renderDashboardOverview() : (
              currentItems.length === 0 ? `
                <div style="padding: 12px; color: var(--tui-fg-dim);">Нет элементов, удовлетворяющих фильтру.</div>
              ` : currentItems.map((it, idx) => {
                const isSel = idx === this.selectedIndex;
                const indexStr = String(idx + 1).padStart(2, '0');
                const titleStr = (it.title || it.name || it.id || '').slice(0, 34);
                const modelStr = it.model ? `[${it.model}]` : (it.category || '');
                const tokStr = it.template ? `~${Math.ceil(it.template.length / 4)}t` : '';

                return `
                  <div class="tui-item-row ${isSel ? 'selected' : ''}" data-idx="${idx}">
                    <span class="tui-item-cursor">${isSel ? '▶' : ' '}</span>
                    <span class="tui-item-title">[${indexStr}] ${titleStr}</span>
                    <span class="tui-item-meta">${modelStr} ${tokStr}</span>
                  </div>
                `;
              }).join('')
            )}
          </div>
        </div>

        <!-- Right Pane: Detail & Inspector -->
        <div class="tui-right-pane">
          <div class="tui-pane-header">
            <span>INSPECTOR: ${currentItem ? (currentItem.title || currentItem.name || currentItem.id) : (tabName === 'DASH' ? 'TELEMETRY' : 'NONE')}</span>
            <span>${currentItem?.version ? `v${currentItem.version}` : ''}</span>
          </div>

          <div class="tui-detail-content" id="tui-detail-content">
            ${tabName === 'DASH' ? this.renderDashboardTelemetry() : this.renderItemDetail(currentItem, tabName)}
          </div>
        </div>
      </div>

      <!-- Bottom Status & Command Line -->
      <div class="tui-bottom-bar">
        <div class="tui-status-line">
          <span class="tui-mode-badge">[${this.mode}]</span>
          <span>${currentItems.length > 0 ? `${this.selectedIndex + 1}/${currentItems.length} items` : '0 items'}</span>
          <span class="tui-key-hints">
            <span>j/k</span>:nav  <span>1-8</span>:tab  <span>/</span>:find  <span>:</span>:cmd  <span>y</span>:yank  <span>s</span>:sync  <span>t</span>:theme  <span>q</span>:gui
          </span>
        </div>

        <div class="tui-command-line">
          <span class="tui-cmd-prefix">${this.mode === 'SEARCH' ? '/' : ':'}</span>
          <input type="text" class="tui-cmd-input" id="tui-cmd-input" spellcheck="false" autocomplete="off">
        </div>
      </div>

      <!-- Quick Help Overlay Modal -->
      <div class="tui-help-modal ${this.mode === 'HELP' ? 'open' : ''}" id="tui-help-modal">
        <div style="font-weight: 800; border-bottom: 1px solid var(--tui-border); padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span>📖 ARTEFACTORY TUI KEYMAP & COMMANDS</span>
          <span style="color: var(--tui-accent);">[Esc / ? to close]</span>
        </div>
        <pre style="margin: 0; line-height: 1.4; color: var(--tui-fg-bright); font-size: 11px;">
┌───────────────────────┬────────────────────────────────────────────────────────┐
│ KEYBOARD SHORTCUT     │ ACTION                                                 │
├───────────────────────┼────────────────────────────────────────────────────────┤
│ j / Down              │ Move cursor down                                       │
│ k / Up                │ Move cursor up                                         │
│ g / G                 │ Jump to top / bottom of list                           │
│ 1 - 8                 │ Switch active registry tab (1:Dash, 2:Sources, etc.)  │
│ /                     │ Quick search & filter mode                             │
│ :                     │ Open Command Prompt (:sync, :export, :commit, :pull)   │
│ y                     │ Yank (copy) current artifact content to clipboard      │
│ s                     │ Trigger real-time Live Sync from sources               │
│ t                     │ Cycle terminal theme (Amber, Green, Cyan, Magenta, etc)│
│ Enter / e             │ Inspect / view full artifact                           │
│ ?                     │ Toggle this help modal                                 │
│ Alt+T / q             │ Toggle back to Modern Web GUI                          │
└───────────────────────┴────────────────────────────────────────────────────────┘

COMMANDS (type : and press Enter):
  :sync                - Trigger dynamic live ingestion
  :export active.md    - Export all active specs to active.md
  :export all.json     - Export full database dump
  :export mcp          - Export mcp_config.json
  :commit [message]    - Stage and push GitOps commit
  :pull                - Git pull & reload database
  :theme [name]        - Set theme (amber, green, cyan, magenta, mono)
  :semantic [query]    - Run vector semantic search
  :gui                 - Switch to Modern Web GUI
        </pre>
      </div>
    `;

    // Attach Click Events
    this.root.querySelectorAll('.tui-tab').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = parseInt(t.getAttribute('data-idx'), 10);
        this.selectedIndex = 0;
        this.render();
      });
    });

    this.root.querySelectorAll('.tui-item-row').forEach(r => {
      r.addEventListener('click', () => {
        this.selectedIndex = parseInt(r.getAttribute('data-idx'), 10);
        this.render();
      });
    });

    this.root.querySelector('#tui-btn-help')?.addEventListener('click', () => {
      this.mode = this.mode === 'HELP' ? 'NORMAL' : 'HELP';
      this.render();
    });

    this.root.querySelector('#tui-btn-gui')?.addEventListener('click', () => {
      this.deactivate();
    });

    const cmdInput = this.root.querySelector('#tui-cmd-input');
    if (this.mode === 'SEARCH' || this.mode === 'COMMAND') {
      cmdInput.focus();
    }
  }

  renderDashboardOverview() {
    const s = this.cache.stats || {};
    return `
      <div style="padding: 10px; line-height: 1.6;">
        <div style="font-weight: 800; color: var(--tui-accent); margin-bottom: 8px;">── SYSTEM REGISTRIES MATRIX ──</div>
        <div>[1] Sources & Specs : <strong>${this.cache.sources.length}</strong></div>
        <div>[2] Prompts Studio  : <strong>${this.cache.prompts.length}</strong></div>
        <div>[3] Skills Catalog  : <strong>${this.cache.skills.length}</strong></div>
        <div>[4] Workflows DAG   : <strong>${this.cache.workflows.length}</strong></div>
        <div>[5] MCP Servers     : <strong>${this.cache.mcp_servers.length}</strong></div>
        <div>[6] Safety Rules    : <strong>${this.cache.rules.length}</strong></div>
        <div style="margin-top: 12px; font-weight: 800; color: var(--tui-accent);">── CONTINUOUS INGESTION ──</div>
        <div>Auto-Sync Status    : <span style="color: var(--tui-success);">ACTIVE (30m cron)</span></div>
        <div>Last Harvest        : ${new Date().toLocaleTimeString()}</div>
        <div>Runtime Environment : Docker Production (00.0x101.lol)</div>
      </div>
    `;
  }

  renderDashboardTelemetry() {
    return `
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ CONTROL TOWER TELEMETRY & GITOPS INTEGRITY                                               │
├──────────────────────────────────────────────────────────────────────────────────────────┤
  Service Version  : 2.0.0-prod
  MCP Gateway SSE  : ONLINE (/mcp/sse)
  Semantic Index   : ACTIVE (TF-IDF Cosine Similarity)
  Remote Repo      : https://github.com/3030202/artefactory.git
  Branch           : main
  Git Working Tree : ${this.cache.gitops?.is_clean ? 'CLEAN' : 'MODIFIED'}

  QUICK TUI SHORTCUTS:
  - Press [3] to jump directly into Prompts Studio
  - Press [4] to inspect Skills SKILL.md
  - Press [5] to inspect DAG Workflows
  - Press [s] to trigger Live Sync
  - Press [t] to switch color theme
  - Press [:] then type ':export active.md' to dump active catalog
└──────────────────────────────────────────────────────────────────────────────────────────┘
    `;
  }

  renderItemDetail(item, tabName) {
    if (!item) return '<div style="color: var(--tui-fg-dim);">Выберите элемент для просмотра.</div>';

    if (tabName === 'PROMPTS') {
      const inTok = Math.ceil((item.template || '').length / 4);
      const outTok = item.model?.includes('claude') ? 1024 : 800;
      return `
ID: ${item.id}
TITLE: ${item.title}
MODEL: ${item.model || 'claude-3-7-sonnet'} | TEMP: ${item.temperature || 0.2} | TOKENS: ~${inTok} in / ~${outTok} out
TAGS: ${(item.tags || []).join(', ')}
SOURCE: ${item.source_title || 'Canonical Reference'}

────────────────────────────────────────────────────────────────────────────────
${item.template || item.content || 'No template body.'}
      `.trim();
    }

    if (tabName === 'SKILLS') {
      return `
ID: ${item.id} | NAME: ${item.name}
CATEGORY: ${item.category} | VERSION: ${item.version || '1.0.0'}
DESCRIPTION: ${item.description || ''}

───────────────────────────── SKILL.md MANIFEST ─────────────────────────────
${item.content || item.template || `---
name: ${item.name}
description: ${item.description}
---

# ${item.title || item.name}
`}
      `.trim();
    }

    if (tabName === 'WORKFLOWS') {
      const nodes = (item.nodes || []).map(n => `  [${n.id}] (${n.type}) ${n.label || ''}`).join('\n');
      const edges = (item.edges || []).map(e => `  [${e.from}] ──► [${e.to}]`).join('\n');
      return `
ID: ${item.id} | TITLE: ${item.title}
CATEGORY: ${item.category} | NODES: ${(item.nodes || []).length} | EDGES: ${(item.edges || []).length}

── DAG TOPOLOGY NODES ──
${nodes || '  (No nodes defined)'}

── EXECUTION FLOW EDGES ──
${edges || '  (No edges defined)'}
      `.trim();
    }

    if (tabName === 'MCP') {
      const tools = (item.tools || []).map(t => `  • ${t.name}: ${t.description || ''}`).join('\n');
      return `
ID: ${item.id} | TITLE: ${item.title || item.name}
TRANSPORT: ${item.transport || 'stdio'} | ENDPOINT: ${item.endpoint_url || item.command || ''}

── REGISTERED JSON-RPC TOOLS ──
${tools || '  (No tools registered)'}
      `.trim();
    }

    if (tabName === 'RULES') {
      return `
ID: ${item.id} | TITLE: ${item.title}
PRIORITY: ${item.priority} | CATEGORY: ${item.category}
INVARIANT: ${item.rule || item.description || ''}
      `.trim();
    }

    if (tabName === 'SOURCES') {
      return `
ID: ${item.id} | TITLE: ${item.title}
CATEGORY: ${item.categoryLabel || item.category} | AUTHOR: ${item.author || ''}
URL: ${item.url || ''}
EXCERPT: ${item.excerpt || ''}
      `.trim();
    }

    return JSON.stringify(item, null, 2);
  }

  initKeyListeners() {
    window.addEventListener('keydown', async (e) => {
      // Global toggle: Alt+T
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (!this.isActive) return;

      const cmdInput = this.root.querySelector('#tui-cmd-input');
      const isInputFocused = document.activeElement === cmdInput;

      // When Command Line or Search is active
      if (isInputFocused) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.mode = 'NORMAL';
          this.searchFilter = '';
          cmdInput.value = '';
          cmdInput.blur();
          this.render();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const val = cmdInput.value.trim();
          if (this.mode === 'SEARCH') {
            this.searchFilter = val;
            this.mode = 'NORMAL';
            cmdInput.blur();
            this.render();
          } else if (this.mode === 'COMMAND') {
            await this.executeCommand(val);
            this.mode = 'NORMAL';
            cmdInput.value = '';
            cmdInput.blur();
            this.render();
          }
        }
        return;
      }

      // NORMAL Mode Navigation
      if (this.mode === 'HELP') {
        if (e.key === 'Escape' || e.key === '?') {
          e.preventDefault();
          this.mode = 'NORMAL';
          this.render();
        }
        return;
      }

      const items = this.getCurrentItems();

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          if (this.selectedIndex < items.length - 1) {
            this.selectedIndex++;
            this.render();
          }
          break;

        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.render();
          }
          break;

        case 'g':
          e.preventDefault();
          this.selectedIndex = 0;
          this.render();
          break;

        case 'G':
          e.preventDefault();
          this.selectedIndex = Math.max(0, items.length - 1);
          this.render();
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          e.preventDefault();
          this.activeTab = parseInt(e.key, 10) - 1;
          this.selectedIndex = 0;
          this.render();
          break;

        case '/':
          e.preventDefault();
          this.mode = 'SEARCH';
          this.render();
          setTimeout(() => {
            const input = this.root.querySelector('#tui-cmd-input');
            if (input) input.focus();
          }, 50);
          break;

        case ':':
          e.preventDefault();
          this.mode = 'COMMAND';
          this.render();
          setTimeout(() => {
            const input = this.root.querySelector('#tui-cmd-input');
            if (input) input.focus();
          }, 50);
          break;

        case 'y': {
          e.preventDefault();
          const item = items[this.selectedIndex];
          if (item) {
            const content = item.template || item.content || item.description || JSON.stringify(item, null, 2);
            navigator.clipboard.writeText(content);
            Toast.success(`Yanked [${item.id || item.title}] to clipboard!`);
          }
          break;
        }

        case 's':
          e.preventDefault();
          Toast.info('Triggering live sync from sources...');
          await api.syncSources();
          await this.fetchAllData();
          Toast.success('Sources synchronized!');
          this.render();
          break;

        case 't':
          e.preventDefault();
          this.cycleTheme();
          break;

        case '?':
          e.preventDefault();
          this.mode = 'HELP';
          this.render();
          break;

        case 'q':
          e.preventDefault();
          this.deactivate();
          break;
      }
    });
  }

  async executeCommand(rawCmd) {
    if (!rawCmd) return;
    const parts = rawCmd.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (cmd === ':gui' || cmd === ':q') {
      this.deactivate();
    } else if (cmd === ':sync') {
      Toast.info('Executing live sync...');
      await api.syncSources();
      await this.fetchAllData();
      Toast.success('Live sync completed!');
    } else if (cmd === ':theme') {
      if (arg) this.setTheme(arg);
      else this.cycleTheme();
    } else if (cmd === ':pull') {
      Toast.info('Git pull & reload...');
      await api.pullGitOps();
      await this.fetchAllData();
      Toast.success('Git pull successful!');
    } else if (cmd === ':commit') {
      const msg = arg || `chore(tui): sync artifacts [${new Date().toLocaleDateString()}]`;
      Toast.info('Git committing...');
      await api.commitGitOps({ message: msg });
      await this.fetchAllData();
      Toast.success('Committed and pushed to origin/main!');
    } else if (cmd === ':export') {
      if (arg.includes('active')) {
        const res = await api.exportActiveSources();
        navigator.clipboard.writeText(res.markdown || '');
        Toast.success('Exported active.md to clipboard!');
      } else if (arg.includes('mcp')) {
        const res = await api.exportMcpConfig();
        navigator.clipboard.writeText(JSON.stringify(res.config, null, 2));
        Toast.success('Exported mcp_config.json to clipboard!');
      } else {
        const res = await api.exportAllJson();
        navigator.clipboard.writeText(JSON.stringify(res, null, 2));
        Toast.success('Exported all.json to clipboard!');
      }
    } else if (cmd === ':semantic' || cmd === ':search') {
      if (arg) {
        const res = await api.searchSemantic({ q: arg, limit: 10 });
        if (res.results && res.results.length > 0) {
          Toast.success(`Semantic search matched ${res.results.length} items`);
          this.searchFilter = arg;
        }
      }
    } else if (cmd === ':help') {
      this.mode = 'HELP';
    } else {
      Toast.error(`Unknown command: ${cmd}`);
    }
  }
}

export const tuiEngine = new TUIEngine();
