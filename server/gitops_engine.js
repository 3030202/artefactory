import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';
import { GitOpsSerializer } from './gitops_serializer.js';

const execAsync = promisify(exec);

export class GitOpsEngine {
  constructor(options = {}) {
    this.workspaceDir = options.workspaceDir || process.cwd();
    this.artifactsDir = path.join(this.workspaceDir, 'artifacts_repo');
    this.remoteUrl = options.remoteUrl || 'https://github.com/3030202/artefactory.git';
    this.defaultBranch = options.defaultBranch || 'main';
    this.webhookSecret = options.webhookSecret || 'artf_sec_gitops_2026';
    
    // Ensure base directory exists
    if (!fs.existsSync(this.artifactsDir)) {
      fs.mkdirSync(this.artifactsDir, { recursive: true });
    }
  }

  // Export current database to the repository filesystem
  async exportToDisk(targetDir = this.artifactsDir) {
    const promptsDir = path.join(targetDir, 'prompts');
    const skillsDir = path.join(targetDir, 'skills');
    const workflowsDir = path.join(targetDir, 'workflows');
    const mcpDir = path.join(targetDir, 'mcp');
    const rulesDir = path.join(targetDir, 'rules');

    [promptsDir, skillsDir, workflowsDir, mcpDir, rulesDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const fileList = [];

    // 1. Prompts
    const prompts = db.getCollection('prompts');
    for (const prompt of prompts) {
      const filePath = path.join(promptsDir, `${prompt.id}.md`);
      const content = GitOpsSerializer.serializePrompt(prompt);
      fs.writeFileSync(filePath, content, 'utf8');
      fileList.push(`prompts/${prompt.id}.md`);
    }

    // 2. Skills
    const skills = db.getCollection('skills');
    for (const skill of skills) {
      const skillFolder = path.join(skillsDir, skill.name || skill.id);
      if (!fs.existsSync(skillFolder)) fs.mkdirSync(skillFolder, { recursive: true });
      const filePath = path.join(skillFolder, 'SKILL.md');
      const content = GitOpsSerializer.serializeSkill(skill);
      fs.writeFileSync(filePath, content, 'utf8');
      fileList.push(`skills/${skill.name || skill.id}/SKILL.md`);
    }

    // 3. Workflows
    const workflows = db.getCollection('workflows');
    for (const wf of workflows) {
      const filePath = path.join(workflowsDir, `${wf.id}.json`);
      const content = GitOpsSerializer.serializeWorkflow(wf);
      fs.writeFileSync(filePath, content, 'utf8');
      fileList.push(`workflows/${wf.id}.json`);
    }

    // 4. MCP Config
    const mcpServers = db.getCollection('mcp_servers');
    const mcpConfigPath = path.join(mcpDir, 'mcp_config.json');
    const mcpContent = GitOpsSerializer.serializeMcpConfig(mcpServers);
    fs.writeFileSync(mcpConfigPath, mcpContent, 'utf8');
    fileList.push('mcp/mcp_config.json');

    // 5. Rules & Compiled AGENTS.md
    const rules = db.getCollection('rules');
    const agentsMdPath = path.join(rulesDir, 'AGENTS.md');
    const compiledRules = GitOpsSerializer.serializeRules(rules);
    fs.writeFileSync(agentsMdPath, compiledRules, 'utf8');
    fileList.push('rules/AGENTS.md');

    for (const rule of rules) {
      const rulePath = path.join(rulesDir, `${rule.id}.md`);
      fs.writeFileSync(rulePath, `# ${rule.title}\n\n${rule.content || rule.description}`, 'utf8');
      fileList.push(`rules/${rule.id}.md`);
    }

    // 6. Manifest
    const manifest = GitOpsSerializer.generateManifest(db);
    const manifestPath = path.join(targetDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    fileList.push('manifest.json');

    return {
      success: true,
      timestamp: new Date().toISOString(),
      exported_files_count: fileList.length,
      files: fileList,
      manifest
    };
  }

  // Import files from disk back into database
  async importFromDisk(sourceDir = this.artifactsDir) {
    const counts = { prompts: 0, skills: 0, workflows: 0, mcp_servers: 0, rules: 0 };

    // 1. Prompts
    const promptsDir = path.join(sourceDir, 'prompts');
    if (fs.existsSync(promptsDir)) {
      const files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const id = path.basename(file, '.md');
        const content = fs.readFileSync(path.join(promptsDir, file), 'utf8');
        const parsed = GitOpsSerializer.deserializePrompt(content, id);
        const existing = db.getById('prompts', id);
        if (existing) {
          db.update('prompts', id, parsed);
        } else {
          db.create('prompts', parsed);
        }
        counts.prompts++;
      }
    }

    // 2. Skills
    const skillsDir = path.join(sourceDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const dir of skillDirs) {
        const skillFile = path.join(skillsDir, dir.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const content = fs.readFileSync(skillFile, 'utf8');
          const skillId = `skl_${dir.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
          const skillData = {
            id: skillId,
            name: dir.name,
            title: dir.name,
            content,
            entry_file: 'SKILL.md',
            category: 'skills'
          };
          const existing = db.getById('skills', skillId);
          if (existing) {
            db.update('skills', skillId, skillData);
          } else {
            db.create('skills', skillData);
          }
          counts.skills++;
        }
      }
    }

    // 3. Workflows
    const workflowsDir = path.join(sourceDir, 'workflows');
    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
          const wf = JSON.parse(content);
          if (wf && wf.id) {
            const existing = db.getById('workflows', wf.id);
            if (existing) {
              db.update('workflows', wf.id, wf);
            } else {
              db.create('workflows', wf);
            }
            counts.workflows++;
          }
        } catch (e) {
          console.warn(`Could not parse workflow ${file}:`, e);
        }
      }
    }

    return {
      success: true,
      imported: counts,
      timestamp: new Date().toISOString()
    };
  }

  // Get live Git repository status
  async getStatus() {
    try {
      // Export current state to track changes accurately
      await this.exportToDisk();

      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.workspaceDir }).catch(() => ({ stdout: 'main\n' }));
      const currentBranch = branchOut.trim();

      const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: this.workspaceDir }).catch(() => ({ stdout: '' }));
      const modifiedLines = statusOut.trim().split('\n').filter(Boolean);

      const { stdout: logOut } = await execAsync('git log -n 5 --pretty=format:"%h|%an|%ar|%s"', { cwd: this.workspaceDir }).catch(() => ({ stdout: '' }));
      const recentCommits = logOut.trim().split('\n').filter(Boolean).map(line => {
        const [hash, author, time, message] = line.split('|');
        return { hash, author, time, message };
      });

      const manifest = GitOpsSerializer.generateManifest(db);

      return {
        success: true,
        branch: currentBranch,
        remote_url: this.remoteUrl,
        is_clean: modifiedLines.length === 0,
        modified_count: modifiedLines.length,
        modified_files: modifiedLines.map(l => l.trim()),
        recent_commits: recentCommits,
        manifest_summary: manifest.counts,
        last_checked: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        branch: 'main',
        remote_url: this.remoteUrl
      };
    }
  }

  // Get full visual Diff of pending changes
  async getDiff() {
    try {
      await this.exportToDisk();
      const { stdout: diffOut } = await execAsync('git diff HEAD', { cwd: this.workspaceDir }).catch(() => ({ stdout: '' }));
      return {
        success: true,
        has_diff: diffOut.trim().length > 0,
        diff: diffOut || 'No uncommitted changes in working tree.'
      };
    } catch (err) {
      return { success: false, error: err.message, diff: '' };
    }
  }

  // Perform Git Commit & Push with developer attribution
  async commitAndPush(options = {}) {
    const {
      message = 'chore(prompt-ops): update canonical artifact registries',
      authorName = 'Prompt Ops Engineer',
      authorEmail = 'ops@0x101.lol',
      token = null
    } = options;

    // 1. Serialize DB to disk
    await this.exportToDisk();

    try {
      // 2. Stage changes
      await execAsync('git add .', { cwd: this.workspaceDir });

      // 3. Commit with author info
      const authorFlag = `--author="${authorName} <${authorEmail}>"`;
      const commitCmd = `git commit ${authorFlag} -m "${message.replace(/"/g, '\\"')}"`;
      const { stdout: commitOut } = await execAsync(commitCmd, { cwd: this.workspaceDir });

      // 4. Push if remote configured
      let pushOut = 'Local commit created.';
      try {
        let remoteTarget = 'origin';
        if (token) {
          remoteTarget = `https://oauth2:${token}@github.com/3030202/artefactory.git`;
        }
        const { stdout: pOut } = await execAsync(`git push ${remoteTarget} HEAD`, { cwd: this.workspaceDir });
        pushOut = pOut || 'Pushed successfully to remote repository.';
      } catch (pushErr) {
        console.warn('Push warning (offline or credentials required):', pushErr.message);
        pushOut = `Committed locally (${pushErr.message.slice(0, 100)})`;
      }

      db.logActivity('GIT_COMMIT', 'gitops', 'repo', message, {
        author: authorName,
        email: authorEmail,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        commit_output: commitOut,
        push_output: pushOut,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (err.message.includes('nothing to commit')) {
        return { success: true, message: 'Nothing to commit, working tree clean.' };
      }
      throw new Error(`Git commit failed: ${err.message}`);
    }
  }

  // Perform Git Pull and database reload
  async pullAndSync(options = {}) {
    try {
      const { stdout: pullOut } = await execAsync('git pull origin main --rebase', { cwd: this.workspaceDir }).catch(err => ({ stdout: err.message }));
      const importReport = await this.importFromDisk();

      db.logActivity('GIT_PULL', 'gitops', 'repo', 'Pulled latest changes from remote repository', {
        pull_output: pullOut,
        imported: importReport.imported
      });

      return {
        success: true,
        pull_output: pullOut,
        imported: importReport.imported,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      throw new Error(`Git pull failed: ${err.message}`);
    }
  }

  // Ingest GitHub / GitLab Webhook event
  async handleWebhook(payload, signature = '') {
    const isPushEvent = payload && (payload.ref || payload.commits);
    if (!isPushEvent) {
      return { success: false, message: 'Ignored non-push event' };
    }

    const pusher = (payload.pusher && payload.pusher.name) || (payload.sender && payload.sender.login) || 'GitHub';
    const commitCount = (payload.commits || []).length;

    console.log(`[GitOps Webhook] Received push event from ${pusher} (${commitCount} commits). Triggering sync...`);
    const syncResult = await this.pullAndSync();

    return {
      success: true,
      pusher,
      commits_received: commitCount,
      sync: syncResult,
      timestamp: new Date().toISOString()
    };
  }
}

export const gitOpsEngine = new GitOpsEngine();
