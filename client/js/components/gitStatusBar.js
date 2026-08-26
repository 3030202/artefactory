import { api } from '../api.js';
import { Toast } from './toast.js';
import { Icons } from './icons.js';

export class GitStatusBar {
  static statusData = null;

  static init() {
    this.refreshStatus();
    // Poll every 45s or refresh on demand
    setInterval(() => this.refreshStatus(), 45000);
  }

  static async refreshStatus() {
    try {
      const res = await api.getGitStatus();
      this.statusData = res.data || {};
      this.render();
    } catch (err) {
      console.warn('Git status check failed:', err);
    }
  }

  static render() {
    if (!this.statusData) return;

    const s = this.statusData;
    const branch = s.branch || 'main';
    const modifiedCount = (s.modified || []).length + (s.untracked || []).length;
    const isClean = s.clean || modifiedCount === 0;

    const containers = [
      document.getElementById('topbar-git-status'),
      document.getElementById('mobile-topbar-git-status')
    ].filter(Boolean);

    containers.forEach(c => {
      c.innerHTML = `
        <div class="git-status-badge ${isClean ? 'clean' : 'dirty'}" title="Click to view GitOps status & Quick Commit" style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); cursor: pointer; transition: all var(--transition-fast); user-select: none;">
          <span style="color: var(--cat-gitops, #ec4899); display: flex; align-items: center;">${Icons.gitops(14)}</span>
          <span style="font-size: 11px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary);">${branch}</span>
          <span class="badge ${isClean ? 'badge-success' : 'badge-danger'}" style="font-size: 9px; padding: 1px 5px; text-transform: none;">
            ${isClean ? 'Clean' : `● ${modifiedCount}`}
          </span>
        </div>
      `;

      c.querySelector('.git-status-badge')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openQuickGitModal();
      });
    });
  }

  static openQuickGitModal() {
    const s = this.statusData || {};
    const modifiedCount = (s.modified || []).length + (s.untracked || []).length;
    const isClean = s.clean || modifiedCount === 0;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window" style="max-width: 520px; width: 92%;">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            <span style="color: var(--cat-gitops, #ec4899);">${Icons.gitops(18)}</span>
            <span>GitOps Repository Quick Sync</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <div class="modal-body" style="gap: 12px;">
          <!-- Repo Banner -->
          <div style="background: rgba(236, 72, 153, 0.08); border: 1px solid rgba(236, 72, 153, 0.25); border-radius: var(--radius-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Branch: ${s.branch || 'main'}</div>
              <div style="font-size: 11px; color: var(--text-secondary); font-family: var(--font-mono); margin-top: 2px;">
                ${s.remote || 'https://github.com/3030202/artefactory.git'}
              </div>
            </div>
            <span class="badge ${isClean ? 'badge-success' : 'badge-warning'}">
              ${isClean ? 'ALL COMMITTED' : `${modifiedCount} UNCOMMITTED`}
            </span>
          </div>

          <!-- Pending Changes List -->
          ${!isClean ? `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
                Modified Artifacts:
              </div>
              <div style="background: #05070d; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 12px; max-height: 100px; overflow-y: auto; font-family: var(--font-mono); font-size: 11px; display: flex; flex-direction: column; gap: 2px;">
                ${(s.modified || []).map(f => `<div style="color: #fbbf24;">M ${f}</div>`).join('')}
                ${(s.untracked || []).map(f => `<div style="color: #34d399;">? ${f}</div>`).join('')}
              </div>
            </div>

            <!-- Commit Message Form -->
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 11.5px;">Commit Message</label>
              
              <!-- Conventional Commit Chips -->
              <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
                <button class="chip-btn btn-commit-prefix" data-prefix="feat(prompts): " style="font-size: 10px; padding: 2px 6px;">feat(prompts)</button>
                <button class="chip-btn btn-commit-prefix" data-prefix="fix(rules): " style="font-size: 10px; padding: 2px 6px;">fix(rules)</button>
                <button class="chip-btn btn-commit-prefix" data-prefix="sync(mcp): " style="font-size: 10px; padding: 2px 6px;">sync(mcp)</button>
                <button class="chip-btn btn-commit-prefix" data-prefix="refactor(skills): " style="font-size: 10px; padding: 2px 6px;">refactor(skills)</button>
              </div>

              <input type="text" class="form-input" id="quick-commit-msg" placeholder="e.g. feat(prompts): add DSPy optimizer template" value="sync(gitops): update AI artifact registries">
            </div>
          ` : `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
              ✅ Working tree clean. All artifacts and configs match remote repository.
            </div>
          `}
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <button class="btn btn-secondary btn-sm" id="btn-quick-goto-diff">
            📄 Full Diff View
          </button>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-quick-pull">
              📥 Pull Remote
            </button>
            ${!isClean ? `
              <button class="btn btn-primary btn-sm" id="btn-quick-commit-push" style="background: var(--cat-gitops, #ec4899); border: none;">
                💾 Commit & Push
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    // Prefix chips
    backdrop.querySelectorAll('.btn-commit-prefix').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = backdrop.querySelector('#quick-commit-msg');
        if (inp) {
          inp.value = btn.getAttribute('data-prefix');
          inp.focus();
        }
      });
    });

    // Go to Full Diff
    backdrop.querySelector('#btn-quick-goto-diff')?.addEventListener('click', () => {
      backdrop.remove();
      if (window.appRouter) window.appRouter.navigate('gitops');
    });

    // Quick Pull
    backdrop.querySelector('#btn-quick-pull')?.addEventListener('click', async () => {
      try {
        Toast.info('Pulling latest changes from remote repository...');
        const res = await api.pullGitOps();
        Toast.success(`Git Pull complete: ${res.data?.pulled_commits || 0} commits synced.`);
        backdrop.remove();
        await this.refreshStatus();
        if (window.appRouter) window.appRouter.updateStatsCounters();
      } catch (err) {
        Toast.error(`Git pull failed: ${err.message}`);
      }
    });

    // Quick Commit & Push
    backdrop.querySelector('#btn-quick-commit-push')?.addEventListener('click', async () => {
      const msg = backdrop.querySelector('#quick-commit-msg')?.value.trim();
      if (!msg) {
        Toast.error('Please enter a commit message');
        return;
      }

      try {
        Toast.info('Committing & pushing changes to GitHub main...');
        const res = await api.commitAndPushGitOps({ message: msg });
        Toast.success(`Commit pushed successfully: ${res.data?.hash || 'OK'}`);
        backdrop.remove();
        await this.refreshStatus();
      } catch (err) {
        Toast.error(`Commit & push failed: ${err.message}`);
      }
    });
  }
}
