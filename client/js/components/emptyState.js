import { Icons } from './icons.js';

export function renderEmptyState(category, onActionClick) {
  const configs = {
    prompts: {
      icon: Icons.prompts(36),
      title: 'No Prompt Templates Registered',
      description: 'Create your first prompt template with model parameters, variables {{var}}, and token metrics or import canonical specs from Sources.',
      primaryBtn: '+ New Prompt Template',
      secondaryBtn: '🔄 Harvest from Sources',
      actionKey: 'create_prompt'
    },
    skills: {
      icon: Icons.skills(36),
      title: 'No Agent Skills Available',
      description: 'Define an agent skill with standard SKILL.md YAML frontmatter or connect an MCP-to-Skill bridge.',
      primaryBtn: '+ Register New Skill',
      secondaryBtn: '🔄 Harvest Skills',
      actionKey: 'create_skill'
    },
    workflows: {
      icon: Icons.workflows(36),
      title: 'No DAG Workflows Configured',
      description: 'Construct multi-agent DAG pipelines, supervisor router graphs or evaluation matrix workflows.',
      primaryBtn: '+ Create DAG Workflow',
      secondaryBtn: '🔄 Load Sample DAG',
      actionKey: 'create_workflow'
    },
    mcp_servers: {
      icon: Icons.mcp(36),
      title: 'No MCP Servers Connected',
      description: 'Register Model Context Protocol servers (GitHub, SQLite, Puppeteer, Ollama) over Stdio or SSE transport.',
      primaryBtn: '+ Register MCP Server',
      secondaryBtn: '📡 View MCP Gateway',
      actionKey: 'create_mcp'
    },
    rules: {
      icon: Icons.rules(36),
      title: 'No Safety Rules & Guardrails Defined',
      description: 'Establish OWASP GenAI Top 10 policies, context isolation rules, and compilation to AGENTS.md.',
      primaryBtn: '+ Add Safety Rule',
      secondaryBtn: '🔄 Sync Security Rules',
      actionKey: 'create_rule'
    },
    sources: {
      icon: Icons.sources(36),
      title: 'Knowledge Hub Empty',
      description: 'Add canonical upstream specifications (Anthropic, DSPy, MCP, OWASP, LangGraph) for continuous harvesting.',
      primaryBtn: '+ Add Custom Source',
      secondaryBtn: '🔄 Initialize 21 Sources',
      actionKey: 'create_source'
    },
    gitops: {
      icon: Icons.gitops(36),
      title: 'Git Repository Clean',
      description: 'All local prompt artifacts and schemas are synchronized with remote GitHub/GitLab repository.',
      primaryBtn: '📥 Pull from Remote',
      secondaryBtn: '💾 Export to Disk',
      actionKey: 'gitops_sync'
    }
  };

  const cfg = configs[category] || configs.prompts;

  return `
    <div class="empty-state-card" style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg); margin: 20px 0;">
      <div style="color: var(--theme-color, #6366f1); margin-bottom: 14px; opacity: 0.9;">
        ${cfg.icon}
      </div>
      <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
        ${cfg.title}
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); max-width: 480px; margin: 0 auto 20px auto; line-height: 1.5;">
        ${cfg.description}
      </div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;">
        <button class="btn btn-primary btn-empty-primary" data-action="${cfg.actionKey}">
          ${cfg.primaryBtn}
        </button>
        <button class="btn btn-secondary btn-empty-secondary" data-action="${cfg.actionKey}_alt">
          ${cfg.secondaryBtn}
        </button>
      </div>
    </div>
  `;
}
