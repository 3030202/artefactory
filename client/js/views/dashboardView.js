import { api } from '../api.js';
import { Toast } from '../components/toast.js';

export const dashboardView = {
  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading Control Tower telemetry...</div>`;

    try {
      const [statsRes, stateRes] = await Promise.all([
        api.getStats(),
        api.getState()
      ]);

      const stats = statsRes.data || {};
      const state = stateRes.state || {};

      container.innerHTML = `
        <div class="section-hero">
          <div class="section-title-group">
            <div class="section-title">
              <span style="font-size: 28px;">🎛️</span>
              <span>Prompt Ops Control Tower</span>
              <span class="badge badge-success">v2.0.0-prod</span>
              <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4);">${state.target_mode || 'EXTENDED'}</span>
            </div>
            <div class="section-desc">
              Централизованный пункт управления и изолированные реестры артефактов ИИ: Промпты, Скиллы, Воркфлоу (DAG), MCP-серверы и Системные директивы.
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" id="btn-export-backup">
              <span>💾</span> Export Backup
            </button>
            <button class="btn btn-secondary" id="btn-reset-db">
              <span>🔄</span> Reset Seed
            </button>
          </div>
        </div>

        <!-- 6 Category Metrics Cards -->
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 28px;">
          <!-- 0. Sources & Specs -->
          <div class="artifact-card" style="border-top: 3px solid var(--cat-sources, #3b82f6); cursor: pointer;" onclick="window.appRouter.navigate('sources')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 22px;">📚</span>
              <span class="badge badge-sources">Sources</span>
            </div>
            <div style="font-size: 26px; font-weight: 800; font-family: var(--font-display);">${stats.sources_count || 0}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Спецификации, MCP, гайды</div>
          </div>

          <!-- 1. Prompts -->
          <div class="artifact-card" style="border-top: 3px solid var(--cat-prompts); cursor: pointer;" onclick="window.appRouter.navigate('prompts')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 22px;">🟣</span>
              <span class="badge badge-prompts">Prompts</span>
            </div>
            <div style="font-size: 26px; font-weight: 800; font-family: var(--font-display);">${stats.prompts_count || 0}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Шаблоны, переменные, песочница</div>
          </div>

          <!-- 2. Skills -->
          <div class="artifact-card" style="border-top: 3px solid var(--cat-skills); cursor: pointer;" onclick="window.appRouter.navigate('skills')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 22px;">🟢</span>
              <span class="badge badge-skills">Skills</span>
            </div>
            <div style="font-size: 26px; font-weight: 800; font-family: var(--font-display);">${stats.skills_count || 0}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">SKILL.md, манифесты, валидатор</div>
          </div>

          <!-- 3. Workflows -->
          <div class="artifact-card" style="border-top: 3px solid var(--cat-workflows); cursor: pointer;" onclick="window.appRouter.navigate('workflows')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 22px;">🟡</span>
              <span class="badge badge-workflows">Workflows</span>
            </div>
            <div style="font-size: 26px; font-weight: 800; font-family: var(--font-display);">${stats.workflows_count || 0}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Графы DAG, пайплайны, запуск</div>
          </div>

          <!-- 4. MCP Servers -->
          <div class="artifact-card" style="border-top: 3px solid var(--cat-mcp); cursor: pointer;" onclick="window.appRouter.navigate('mcp')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 22px;">🌐</span>
              <span class="badge badge-mcp">MCP Servers</span>
            </div>
            <div style="font-size: 26px; font-weight: 800; font-family: var(--font-display);">${stats.mcp_servers_count || 0}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Инспектор тулов, ping, mcp_config</div>
          </div>

          <!-- 5. Rules -->
          <div class="artifact-card" style="border-top: 3px solid var(--cat-rules); cursor: pointer;" onclick="window.appRouter.navigate('rules')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 22px;">🔴</span>
              <span class="badge badge-rules">Rules</span>
            </div>
            <div style="font-size: 26px; font-weight: 800; font-family: var(--font-display);">${stats.rules_count || 0}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">AGENTS.md, директивы, компилятор</div>
          </div>
        </div>

        <!-- Middle Section: Lifecycle Roadmap & Subagents Pool -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 28px;">
          <!-- Lifecycle Roadmap Card -->
          <div class="artifact-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span> Lifecycle Roadmap & Gates
              </div>
              <span class="badge badge-warning">Phase 1 & 2 Execution</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Phase 1 -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--status-success); border-radius: 6px;">
                <div>
                  <div style="font-weight: 600; font-size: 13px;">Phase 1: Ingestion, Analysis & Diff Spec</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Архитектурный дифференциал и матрица дельт</div>
                </div>
                <span class="badge badge-success">COMPLETED</span>
              </div>

              <!-- Phase 2 -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(99, 102, 241, 0.12); border-left: 3px solid var(--primary); border-radius: 6px;">
                <div>
                  <div style="font-weight: 600; font-size: 13px;">Phase 2: Multi-Registry Architecture & MCP</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Express REST API, Dockerfile, MCP протоколы</div>
                </div>
                <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc;">IN_PROGRESS</span>
              </div>

              <!-- Phase 3 -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border-left: 3px solid #64748b; border-radius: 6px;">
                <div>
                  <div style="font-weight: 600; font-size: 13px;">Phase 3: Implementation & TDD Test Suites</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Интерактивные студии промптов, DAG visualizer, валидаторы</div>
                </div>
                <span class="badge badge-version">ACTIVE</span>
              </div>

              <!-- Phase 4,5,6 -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border-left: 3px solid #475569; border-radius: 6px;">
                <div>
                  <div style="font-weight: 600; font-size: 13px;">Phase 4-6: Fault Tolerance, Docker CI/CD & Ops</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Резервное копирование, контейнеризация и мониторинг</div>
                </div>
                <span class="badge badge-version">PENDING</span>
              </div>
            </div>
          </div>

          <!-- Subagents Pool Card -->
          <div class="artifact-card">
            <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span>🤖</span> Subagents Pool
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <span style="font-weight: 500;">🏗️ Architect</span>
                <span class="badge badge-success">ACTIVE</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <span style="font-weight: 500;">💻 Coder</span>
                <span class="badge badge-success">ACTIVE</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <span style="font-weight: 500;">🧪 Tester</span>
                <span class="badge badge-warning">ENGAGED</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <span style="font-weight: 500;">🔍 Reviewer</span>
                <span class="badge badge-version">STANDBY</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <span style="font-weight: 500;">🐳 DevOps</span>
                <span class="badge badge-success">READY</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Audit Log Feed -->
        <div class="artifact-card">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📜</span> Recent Operations & Audit Trail
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${(stats.recent_logs || []).map(log => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="badge badge-version">${log.action}</span>
                  <span style="font-weight: 600; color: var(--text-primary);">${log.itemTitle || log.itemId}</span>
                </div>
                <span style="color: var(--text-muted); font-family: var(--font-mono);">${new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Event handlers
      document.getElementById('btn-export-backup')?.addEventListener('click', async () => {
        const res = await api.exportBundle();
        Toast.success(`Backup saved to ${res.backup_file}`);
      });

      document.getElementById('btn-reset-db')?.addEventListener('click', async () => {
        if (confirm('Reset database to initial seed data?')) {
          await api.resetSeed();
          Toast.success('Database restored to default seed.');
          window.appRouter.refresh();
        }
      });

    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load Dashboard: ${err.message}</div>`;
    }
  }
};
