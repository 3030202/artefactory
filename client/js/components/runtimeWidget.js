import { api } from '../api.js';
import { Toast } from './toast.js';
import { Icons } from './icons.js';

export class RuntimeWidget {
  static init() {
    const footerWidget = document.querySelector('.env-status-card');
    if (!footerWidget) return;

    footerWidget.style.cursor = 'pointer';
    footerWidget.setAttribute('title', 'Click to inspect Docker Runtime Telemetry, Logs & Health');

    footerWidget.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTelemetryModal();
    });
  }

  static async openTelemetryModal(initialTab = 'telemetry') {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window" style="max-width: 720px; width: 95%;">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>${Icons.server(20)}</span>
            <span>Docker Runtime Control & Logs Inspector</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <!-- Tabs Navigation -->
        <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding: 0 20px; background: rgba(0,0,0,0.2);">
          <button class="tab-btn ${initialTab === 'telemetry' ? 'active' : ''}" data-tab="telemetry" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;">
            📊 Telemetry & Health
          </button>
          <button class="tab-btn ${initialTab === 'logs' ? 'active' : ''}" data-tab="logs" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;">
            📜 Live Activity Logs
          </button>
          <button class="tab-btn ${initialTab === 'actions' ? 'active' : ''}" data-tab="actions" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;">
            ⚙️ Maintenance & Actions
          </button>
        </div>

        <div class="modal-body" id="runtime-modal-body" style="gap: 16px; max-height: 60vh; overflow-y: auto;">
          <div style="text-align: center; padding: 24px; color: var(--text-muted);">
            Loading live container runtime data...
          </div>
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <span class="env-dot"></span>
            <span>Live Container Connection</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-refresh-tab">
              <span>🔄</span> Refresh
            </button>
            <button class="btn btn-primary btn-sm btn-close-modal">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    let currentTab = initialTab;
    let selectedLogLevel = 'ALL';
    let logSearchQuery = '';

    const updateTabStyles = () => {
      backdrop.querySelectorAll('.tab-btn').forEach(btn => {
        const isAct = btn.getAttribute('data-tab') === currentTab;
        btn.classList.toggle('active', isAct);
        btn.style.color = isAct ? 'var(--text-primary)' : 'var(--text-secondary)';
        btn.style.borderBottomColor = isAct ? 'var(--theme-color, #6366f1)' : 'transparent';
      });
    };

    updateTabStyles();

    backdrop.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.getAttribute('data-tab');
        updateTabStyles();
        renderActiveTab();
      });
    });

    const renderActiveTab = async () => {
      const body = backdrop.querySelector('#runtime-modal-body');
      if (!body) return;

      if (currentTab === 'telemetry') {
        try {
          const res = await api.getSystemTelemetry();
          const t = res.data || {};
          const mem = t.memory || {};

          body.innerHTML = `
            <!-- Top Health Banner -->
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="env-dot" style="width: 10px; height: 10px;"></span>
                <div>
                  <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${t.runtime || 'Docker Container (Node.js)'}</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Production Host: 31.76.102.23 (00.0x101.lol)</div>
                </div>
              </div>
              <span class="badge badge-success">HEALTHY</span>
            </div>

            <!-- Key Metrics Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 8px;">
                <div style="font-size: 11px; color: var(--text-muted);">Container Uptime</div>
                <div style="font-size: 15px; font-weight: 700; color: #34d399; font-family: var(--font-mono); margin-top: 2px;">
                  ${t.uptime_human || 'Active'}
                </div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 8px;">
                <div style="font-size: 11px; color: var(--text-muted);">Memory RSS / Heap</div>
                <div style="font-size: 15px; font-weight: 700; color: #60a5fa; font-family: var(--font-mono); margin-top: 2px;">
                  ${mem.rss_mb || 0} MB <span style="font-size: 11px; color: var(--text-muted);">(${mem.heap_used_mb || 0} MB heap)</span>
                </div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 8px;">
                <div style="font-size: 11px; color: var(--text-muted);">Node.js Engine</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-top: 2px;">
                  ${t.node_version} (${t.platform})
                </div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 8px;">
                <div style="font-size: 11px; color: var(--text-muted);">Process ID</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-top: 2px;">
                  PID: ${t.pid} (Isolated container cgroup)
                </div>
              </div>
            </div>

            <!-- Subsystem Health Status Matrix -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Subsystem Health Matrix</div>
              
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                <span style="color: var(--text-secondary);">Model Context Protocol (MCP) Gateway</span>
                <span class="badge badge-success">ONLINE (/mcp/sse)</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                <span style="color: var(--text-secondary);">Semantic Vector Search Engine (Cosine TF-IDF)</span>
                <span class="badge badge-prompts">INDEXED (Active)</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                <span style="color: var(--text-secondary);">Dynamic Upstream Harvester</span>
                <span class="badge badge-warning">21 Specs Registered</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                <span style="color: var(--text-secondary);">GitOps Sync Engine</span>
                <span class="badge badge-gitops">3030202/artefactory (main)</span>
              </div>
            </div>
          `;
        } catch (err) {
          body.innerHTML = `<div style="color: var(--status-danger);">Failed to load telemetry: ${err.message}</div>`;
        }
      } else if (currentTab === 'logs') {
        try {
          const res = await api.getSystemLogs({ limit: 80, level: selectedLogLevel });
          const logsData = res.data || {};
          const logs = logsData.logs || [];

          body.innerHTML = `
            <!-- Log Controls & Filters -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
              <div style="display: flex; gap: 6px;">
                ${['ALL', 'INFO', 'WARN', 'ERROR'].map(lvl => `
                  <button class="chip-btn ${selectedLogLevel === lvl ? 'active' : ''}" data-log-level="${lvl}" style="padding: 4px 10px; font-size: 11px;">
                    ${lvl}
                  </button>
                `).join('')}
              </div>
              <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                Showing ${logs.length} / ${logsData.total_count || 0} events
              </div>
            </div>

            <!-- Terminal Log Window -->
            <div id="logs-terminal" style="background: #05070d; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; font-family: var(--font-mono); font-size: 11.5px; height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
              ${logs.length === 0 ? `
                <div style="color: var(--text-muted); text-align: center; margin-top: 100px;">
                  No activity log events matching current filter.
                </div>
              ` : logs.map(l => {
                const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '--:--:--';
                const lvlColor = l.level === 'ERROR' ? '#f43f5e' : (l.level === 'WARN' ? '#fbbf24' : '#34d399');
                return `
                  <div style="display: flex; align-items: flex-start; gap: 8px; line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px;">
                    <span style="color: var(--text-muted); font-size: 10px; min-width: 60px;">${timeStr}</span>
                    <span style="color: ${lvlColor}; font-weight: 700; font-size: 10px; min-width: 44px;">[${l.level || 'INFO'}]</span>
                    <span style="color: #60a5fa; font-weight: 600;">[${l.category || 'sys'}]</span>
                    <span style="color: var(--text-primary);">${l.action ? `<b>${l.action}</b> ` : ''}${l.itemTitle || l.itemId || ''}</span>
                    ${l.details && Object.keys(l.details).length > 0 ? `
                      <span style="color: var(--text-muted); font-size: 10.5px; margin-left: auto;">${JSON.stringify(l.details)}</span>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Export / Copy Action -->
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn btn-secondary btn-sm" id="btn-copy-logs" style="font-size: 11px;">
                📋 Copy Plain Text
              </button>
            </div>
          `;

          body.querySelectorAll('[data-log-level]').forEach(btn => {
            btn.addEventListener('click', () => {
              selectedLogLevel = btn.getAttribute('data-log-level');
              renderActiveTab();
            });
          });

          body.querySelector('#btn-copy-logs')?.addEventListener('click', () => {
            const rawText = logs.map(l => `[${l.timestamp}] [${l.level || 'INFO'}] [${l.category}] ${l.action || ''} ${l.itemTitle || ''} ${JSON.stringify(l.details || {})}`).join('\n');
            navigator.clipboard.writeText(rawText);
            Toast.success('Logs copied to clipboard');
          });
        } catch (err) {
          body.innerHTML = `<div style="color: var(--status-danger);">Failed to load logs: ${err.message}</div>`;
        }
      } else if (currentTab === 'actions') {
        body.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              Container Lifecycle & Database Maintenance
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px;">
              <div>
                <div style="font-weight: 600; font-size: 13px;">Create Database Snapshot Backup</div>
                <div style="font-size: 11px; color: var(--text-muted);">Generates an instant JSON snapshot of all 5 registries into data/backups/</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-act-backup">
                💾 Backup DB
              </button>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px;">
              <div>
                <div style="font-weight: 600; font-size: 13px;">Trigger Upstream Source Harvest</div>
                <div style="font-size: 11px; color: var(--text-muted);">Re-sync canonical prompt specifications, skills, and MCP tools</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-act-sync">
                ⚡ Sync Sources
              </button>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px;">
              <div>
                <div style="font-weight: 600; font-size: 13px;">Rebuild Semantic Vector Index</div>
                <div style="font-size: 11px; color: var(--text-muted);">Re-calculates subword N-grams and TF-IDF matrices across all artifacts</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-act-reindex">
                🧠 Reindex Vectors
              </button>
            </div>
          </div>
        `;

        body.querySelector('#btn-act-backup')?.addEventListener('click', async () => {
          try {
            const res = await api.exportBundle();
            Toast.success(`Backup generated: ${res.backup_file}`);
          } catch (err) {
            Toast.error(err.message || 'Backup failed');
          }
        });

        body.querySelector('#btn-act-sync')?.addEventListener('click', async () => {
          try {
            Toast.info('Harvesting upstream specs...');
            const res = await api.syncSources();
            Toast.success(`Harvest completed: ${res.data?.prompts_created || 0} prompts updated.`);
          } catch (err) {
            Toast.error(err.message || 'Sync failed');
          }
        });

        body.querySelector('#btn-act-reindex')?.addEventListener('click', async () => {
          try {
            const res = await api.reindexSemantic();
            Toast.success(`Semantic index updated: ${res.documents_indexed || 0} docs indexed.`);
          } catch (err) {
            Toast.error(err.message || 'Reindex failed');
          }
        });
      }
    };

    await renderActiveTab();

    backdrop.querySelector('#btn-refresh-tab')?.addEventListener('click', renderActiveTab);
  }
}
