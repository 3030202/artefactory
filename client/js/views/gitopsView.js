import { api } from '../api.js';
import { Toast } from '../components/toast.js';

export const gitopsView = {
  status: null,
  diffData: null,
  currentUser: JSON.parse(localStorage.getItem('artefactory_git_user') || 'null'),

  async render(container, app) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading GitOps Hub & Repository Status...</div>`;
    await this.loadStatus(container);
  },

  async loadStatus(container) {
    try {
      const [statusRes, diffRes] = await Promise.all([
        api.getGitOpsStatus(),
        api.getGitOpsDiff()
      ]);
      this.status = statusRes.data || {};
      this.diffData = diffRes.data || {};
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `<div style="padding: 30px; color: var(--status-danger);">Failed to load GitOps status: ${err.message}</div>`;
    }
  },

  renderUI(container) {
    const isClean = this.status.is_clean;
    const modifiedCount = this.status.modified_count || 0;
    const branch = this.status.branch || 'main';
    const remoteUrl = this.status.remote_url || 'https://github.com/3030202/artefactory.git';
    const commits = this.status.recent_commits || [];
    const manifest = this.status.manifest_summary || {};

    container.innerHTML = `
      <div class="section-hero">
        <div class="section-title-group">
          <div class="section-title">
            <span>🐙</span>
            <span>GitOps & Remote Sync Hub</span>
            <span class="badge badge-gitops">GitOps 2-Way Sync</span>
            <span class="badge ${isClean ? 'badge-success' : 'badge-warning'}">
              ${isClean ? '● Clean Working Tree' : `● ${modifiedCount} Staged / Modified`}
            </span>
          </div>
          <div class="section-desc">
            Двухсторонняя синхронизация артефактов с Git-репозиторием <a href="${remoteUrl}" target="_blank" style="color: var(--theme-color, #ec4899); text-decoration: underline;">3030202/artefactory</a>, сессионные коммиты с авторством, просмотр визуального Diff и вебхуки.
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-git-pull" title="Подтянуть свежие изменения из Git">
            <span>📥</span> Pull from Remote
          </button>
          <button class="btn btn-secondary" id="btn-export-disk" title="Экспортировать структуру файлов на диск">
            <span>💾</span> Export Files
          </button>
          <button class="btn btn-secondary" id="btn-open-webhook-modal" title="Настройка GitHub Webhook">
            <span>⚡</span> Webhook Setup
          </button>
          <button class="btn btn-primary" id="btn-open-commit-modal" ${isClean ? '' : 'style="box-shadow: 0 0 20px rgba(236,72,153,0.5);"'}>
            <span>🚀</span> Review & Commit (${modifiedCount})
          </button>
        </div>
      </div>

      <!-- Developer Identity Banner -->
      <div style="background: rgba(236, 72, 153, 0.08); border: 1px solid rgba(236, 72, 153, 0.25); border-radius: var(--radius-md); padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">👤</div>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              ${this.currentUser ? `Developer: <strong>${this.currentUser.username}</strong> (${this.currentUser.email || 'ops@0x101.lol'})` : 'Anonymous Developer (Default Attribution)'}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Target Remote: <code style="color: #f472b6;">${remoteUrl}</code> • Branch: <code style="color: #34d399;">${branch}</code>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-auth-user" style="padding: 6px 12px; font-size: 12px;">
          <span>🔑</span> ${this.currentUser ? 'Switch Account / PAT' : 'Login / Set GitHub PAT'}
        </button>
      </div>

      <!-- Main GitOps Grids -->
      <div class="dashboard-middle-grid">
        <!-- Left: Repository Working Tree Status & Staged Changes -->
        <div class="artifact-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>📁</span> Modified & Staged Artifacts (${modifiedCount})
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-refresh-status" style="padding: 4px 8px; font-size: 11px;">
              <span>🔄</span> Refresh
            </button>
          </div>

          ${isClean ? `
            <div style="padding: 30px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
              <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
              <div style="font-weight: 600; color: var(--text-secondary);">Рабочая ветка синхронизирована</div>
              <div style="font-size: 12px;">Все артефакты базы зафиксированы в репозитории.</div>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
              ${(this.status.modified_files || []).map(file => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #050811; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #fbbf24;">●</span>
                    <span style="color: var(--text-primary);">${file}</span>
                  </div>
                  <span class="badge badge-warning">Modified</span>
                </div>
              `).join('')}
            </div>
          `}

          <!-- Manifest Inventory Summary -->
          <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center;">
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px;">
              <div style="font-size: 16px; font-weight: 800; color: #c084fc;">${manifest.prompts || 0}</div>
              <div style="font-size: 10px; color: var(--text-muted);">Prompts</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px;">
              <div style="font-size: 16px; font-weight: 800; color: #34d399;">${manifest.skills || 0}</div>
              <div style="font-size: 10px; color: var(--text-muted);">Skills</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px;">
              <div style="font-size: 16px; font-weight: 800; color: #fbbf24;">${manifest.workflows || 0}</div>
              <div style="font-size: 10px; color: var(--text-muted);">Workflows</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px;">
              <div style="font-size: 16px; font-weight: 800; color: #22d3ee;">${manifest.mcp_servers || 0}</div>
              <div style="font-size: 10px; color: var(--text-muted);">MCP</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px;">
              <div style="font-size: 16px; font-weight: 800; color: #fb7185;">${manifest.rules || 0}</div>
              <div style="font-size: 10px; color: var(--text-muted);">Rules</div>
            </div>
          </div>
        </div>

        <!-- Right: Recent Git Commits Timeline -->
        <div class="artifact-card">
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📜</span> Recent Git Commit History
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto;">
            ${commits.length === 0 ? `
              <div style="padding: 20px; text-align: center; color: var(--text-muted);">История коммитов пока пуста.</div>
            ` : commits.map(c => `
              <div style="padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--theme-color, #ec4899);">${c.hash}</span>
                  <span style="font-size: 11px; color: var(--text-muted);">${c.time}</span>
                </div>
                <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${c.message}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">Author: <strong>${c.author}</strong></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Bottom: Visual Diff Viewer Pane -->
      <div class="artifact-card" style="margin-top: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <span>🔍</span> Unified Git Diff Inspector
          </div>
          <span class="badge ${this.diffData.has_diff ? 'badge-warning' : 'badge-success'}">
            ${this.diffData.has_diff ? 'Uncommitted Diffs Present' : 'Working Tree Clean'}
          </span>
        </div>

        <pre style="background: #050811; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; font-family: var(--font-mono); font-size: 12px; color: #94a3b8; max-height: 280px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;">${this.diffData.diff || 'No differences between database and git working tree.'}</pre>
      </div>
    `;

    // Attach Action Listeners
    container.querySelector('#btn-refresh-status')?.addEventListener('click', () => {
      this.loadStatus(container);
    });

    container.querySelector('#btn-git-pull')?.addEventListener('click', async () => {
      Toast.info('Выполняется Git Pull из удаленного репозитория...');
      try {
        const res = await api.pullGitOps();
        Toast.success('Репозиторий и база успешно синхронизированы!');
        await this.loadStatus(container);
        if (window.appRouter) window.appRouter.updateStatsCounters();
      } catch (err) {
        Toast.error(err.message || 'Ошибка Git Pull');
      }
    });

    container.querySelector('#btn-export-disk')?.addEventListener('click', async () => {
      Toast.info('Сериализация артефактов на диск...');
      try {
        const res = await api.exportGitOps();
        Toast.success(`Успешно экспортировано ${res.data.exported_files_count} файлов!`);
        await this.loadStatus(container);
      } catch (err) {
        Toast.error(err.message || 'Ошибка экспорта');
      }
    });

    container.querySelector('#btn-open-webhook-modal')?.addEventListener('click', () => {
      this.openWebhookModal();
    });

    container.querySelector('#btn-auth-user')?.addEventListener('click', () => {
      this.openAuthModal(container);
    });

    container.querySelector('#btn-open-commit-modal')?.addEventListener('click', () => {
      this.openCommitModal(container);
    });
  },

  // Modal: Commit & Push Review
  openCommitModal(container) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const defaultMsg = `chore(prompt-ops): update canonical artifact registries [${new Date().toLocaleDateString()}]`;
    const defaultAuthor = this.currentUser ? this.currentUser.username : 'Prompt Ops Engineer';
    const defaultEmail = this.currentUser ? this.currentUser.email : 'ops@0x101.lol';

    backdrop.innerHTML = `
      <div class="modal-window modal-wide">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>🚀</span>
            <span>Review, Commit & Push to Git</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body">
          <div class="split-pane">
            <!-- Left: Commit Parameters -->
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label class="form-label">Commit Message <span style="color: var(--status-danger);">*</span></label>
                <textarea class="form-textarea" id="commit-msg" rows="3" placeholder="Опишите изменения...">${defaultMsg}</textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label class="form-label">Author Name</label>
                  <input type="text" class="form-input" id="commit-author" value="${defaultAuthor}">
                </div>
                <div>
                  <label class="form-label">Author Email</label>
                  <input type="email" class="form-input" id="commit-email" value="${defaultEmail}">
                </div>
              </div>

              <div>
                <label class="form-label">GitHub Personal Access Token (PAT) <span style="color: var(--text-muted); font-size: 11px;">(Опционально)</span></label>
                <input type="password" class="form-input" id="commit-token" placeholder="ghp_... или токен с правами repo:write">
              </div>

              <!-- Staged files count alert -->
              <div style="padding: 10px 14px; background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.3); border-radius: var(--radius-md); font-size: 12px; color: var(--text-primary);">
                💡 Будут автоматически зафиксированы все текущие промпты, навыки, воркфлоу, конфиг MCP и манифест.
              </div>
            </div>

            <!-- Right: Pending Unified Diff -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div class="pane-header">
                <span>🔍 Preview Diff</span>
                <span class="badge badge-gitops">git diff HEAD</span>
              </div>
              <pre style="background: #050811; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-family: var(--font-mono); font-size: 11px; color: #94a3b8; height: 260px; overflow-y: auto; white-space: pre-wrap;">${this.diffData.diff || 'No unstaged diffs.'}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Отмена</button>
          <button class="btn btn-primary" id="btn-submit-commit" style="background: var(--cat-gitops, #ec4899);">
            <span>🚀</span> Commit & Push
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    backdrop.querySelector('#btn-submit-commit')?.addEventListener('click', async (e) => {
      const msg = backdrop.querySelector('#commit-msg').value.trim();
      const author = backdrop.querySelector('#commit-author').value.trim();
      const email = backdrop.querySelector('#commit-email').value.trim();
      const token = backdrop.querySelector('#commit-token').value.trim();

      if (!msg) {
        Toast.error('Введите сообщение коммита');
        return;
      }

      e.target.disabled = true;
      e.target.innerHTML = `<span>⏳</span> Pushing to Git...`;

      try {
        const res = await api.commitGitOps({
          message: msg,
          authorName: author,
          authorEmail: email,
          token: token || undefined
        });

        backdrop.remove();
        Toast.success('Коммит успешно создан и отправлен в репозиторий!');
        await this.loadStatus(container);
      } catch (err) {
        e.target.disabled = false;
        e.target.innerHTML = `<span>🚀</span> Commit & Push`;
        Toast.error(err.message || 'Ошибка коммита');
      }
    });
  },

  // Modal: Webhook Configuration Setup
  openWebhookModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    const webhookUrl = `${window.location.origin}/api/gitops/webhook`;

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>⚡</span>
            <span>GitHub / GitLab Webhook Setup</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body" style="gap: 16px;">
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
            Настройте Webhook в вашем GitHub репозитории (<strong>Settings ➔ Webhooks ➔ Add webhook</strong>), чтобы Control Tower мгновенно обновлял базу артефактов при любом внешнем push от команды.
          </div>

          <div>
            <label class="form-label">Payload URL</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" id="wh-url" value="${webhookUrl}" readonly>
              <button class="btn btn-secondary" id="btn-copy-wh-url">📋 Copy</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="form-label">Content type</label>
              <input type="text" class="form-input" value="application/json" readonly>
            </div>
            <div>
              <label class="form-label">Secret</label>
              <input type="text" class="form-input" value="artf_sec_gitops_2026" readonly>
            </div>
          </div>

          <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-md); font-size: 12px; color: var(--text-primary);">
            ✅ <strong>Events:</strong> Выберите «Just the push event». При каждом пуше в ветку <code>main</code> сервер автоматически выполнит <code>git pull</code> и обновит все 5 реестров.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary btn-close-modal">Понятно</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    backdrop.querySelector('#btn-copy-wh-url')?.addEventListener('click', () => {
      navigator.clipboard.writeText(webhookUrl);
      Toast.success('Webhook URL скопирован в буфер обмена!');
    });
  },

  // Modal: Developer Authentication & PAT
  openAuthModal(container) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span>🔑</span>
            <span>Developer Account & Personal Access Token</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body" style="gap: 14px;">
          <div>
            <label class="form-label">GitHub Username</label>
            <input type="text" class="form-input" id="auth-username" placeholder="например, 3030202 или octocat" value="${this.currentUser?.username || ''}">
          </div>

          <div>
            <label class="form-label">Developer Email</label>
            <input type="email" class="form-input" id="auth-email" placeholder="dev@company.com" value="${this.currentUser?.email || ''}">
          </div>

          <div>
            <label class="form-label">GitHub Personal Access Token (PAT)</label>
            <input type="password" class="form-input" id="auth-pat" placeholder="ghp_... (токен с правами repo/workflow)">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-close-modal">Отмена</button>
          <button class="btn btn-primary" id="btn-save-auth">Сохранить сессию</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    backdrop.querySelector('#btn-save-auth')?.addEventListener('click', () => {
      const username = backdrop.querySelector('#auth-username').value.trim() || 'Prompt Ops Engineer';
      const email = backdrop.querySelector('#auth-email').value.trim() || 'ops@0x101.lol';
      const pat = backdrop.querySelector('#auth-pat').value.trim();

      const userSession = { username, email, pat: pat || null };
      localStorage.setItem('artefactory_git_user', JSON.stringify(userSession));
      this.currentUser = userSession;

      backdrop.remove();
      Toast.success(`Сессия разработчика ${username} сохранена!`);
      this.renderUI(container);
    });
  }
};
