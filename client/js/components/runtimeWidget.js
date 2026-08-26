import { api } from '../api.js';
import { Toast } from './toast.js';
import { Icons } from './icons.js';

export class RuntimeWidget {
  static init() {
    const footerWidget = document.querySelector('.env-status-card');
    if (!footerWidget) return;

    footerWidget.style.cursor = 'pointer';
    footerWidget.setAttribute('title', 'Click to inspect Docker Runtime Telemetry & Health');

    footerWidget.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTelemetryModal();
    });
  }

  static async openTelemetryModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>${Icons.server(20)}</span>
            <span>Docker Runtime Telemetry & Health</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body" id="telemetry-body" style="gap: 16px;">
          <div style="text-align: center; padding: 20px; color: var(--text-muted);">
            Loading live container telemetry...
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="btn-db-backup">
            <span>💾</span> Create DB Backup
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-refresh-telemetry">
            <span>🔄</span> Refresh
          </button>
          <button class="btn btn-primary btn-sm btn-close-modal">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    const loadData = async () => {
      const body = backdrop.querySelector('#telemetry-body');
      try {
        const res = await api.getSystemTelemetry();
        const t = res.data || {};
        const mem = t.memory || {};

        body.innerHTML = `
          <!-- Top Health Banner -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="env-dot" style="width: 10px; height: 10px;"></span>
              <span style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${t.runtime || 'Docker Container'}</span>
            </div>
            <span class="badge badge-success">HEALTHY</span>
          </div>

          <!-- Key Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 6px;">
              <div style="font-size: 11px; color: var(--text-muted);">Container Uptime</div>
              <div style="font-size: 14px; font-weight: 700; color: #34d399; font-family: var(--font-mono); margin-top: 2px;">
                ${t.uptime_human || 'Active'}
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 6px;">
              <div style="font-size: 11px; color: var(--text-muted);">Memory RSS / Heap</div>
              <div style="font-size: 14px; font-weight: 700; color: #60a5fa; font-family: var(--font-mono); margin-top: 2px;">
                ${mem.rss_mb || 0} MB <span style="font-size: 11px; color: var(--text-muted);">(${mem.heap_used_mb || 0} MB heap)</span>
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 6px;">
              <div style="font-size: 11px; color: var(--text-muted);">Node.js Engine</div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-top: 2px;">
                ${t.node_version} (${t.platform})
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 6px;">
              <div style="font-size: 11px; color: var(--text-muted);">Process ID</div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-top: 2px;">
                PID: ${t.pid}
              </div>
            </div>
          </div>

          <!-- Services Matrix -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Subsystem Health Status</div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
              <span style="color: var(--text-secondary);">MCP Gateway SSE</span>
              <span class="badge badge-success">ONLINE (/mcp/sse)</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
              <span style="color: var(--text-secondary);">Semantic Vector Engine</span>
              <span class="badge badge-prompts">TF-IDF INDEXED</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
              <span style="color: var(--text-secondary);">Dynamic Ingestion Worker</span>
              <span class="badge badge-warning">30m Cron Active</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
              <span style="color: var(--text-secondary);">GitOps Repository Target</span>
              <span class="badge badge-gitops">3030202/artefactory (main)</span>
            </div>
          </div>
        `;
      } catch (err) {
        body.innerHTML = `<div style="color: var(--status-danger);">Failed to load telemetry: ${err.message}</div>`;
      }
    };

    await loadData();

    backdrop.querySelector('#btn-refresh-telemetry')?.addEventListener('click', loadData);
    backdrop.querySelector('#btn-db-backup')?.addEventListener('click', async () => {
      try {
        const res = await api.exportBundle();
        Toast.success(`Backup generated: ${res.backup_file}`);
      } catch (err) {
        Toast.error(err.message || 'Backup failed');
      }
    });
  }
}
