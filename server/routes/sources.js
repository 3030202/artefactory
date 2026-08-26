import express from 'express';
import { db } from '../db.js';
import { ingestionEngine } from '../ingestion_engine.js';

const router = express.Router();

// Dynamic Harvesting / Sync Endpoints
router.post('/sync', async (req, res) => {
  try {
    const report = await ingestionEngine.syncAll(req.body);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sync/status', (req, res) => {
  res.json({ success: true, status: ingestionEngine.syncStats });
});

router.post('/:id/sync', async (req, res) => {
  try {
    const result = await ingestionEngine.syncSource(req.params.id);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Get all sources
router.get('/', (req, res) => {
  const { category, tag, year, search } = req.query;
  const sources = db.getAll('sources', { category, tag, year, search });
  res.json({ success: true, count: sources.length, data: sources });
});

// Get single source
router.get('/:id', (req, res) => {
  const source = db.getById('sources', req.params.id);
  if (!source) {
    return res.status(404).json({ success: false, error: 'Source not found' });
  }
  res.json({ success: true, data: source });
});

// Create new source
router.post('/', (req, res) => {
  const { title, category, url, repo_url, author, license, year, tags, excerpt, canonical_schema, target_registries } = req.body;
  if (!title || !url) {
    return res.status(400).json({ success: false, error: 'Title and URL are required' });
  }

  const newSource = db.create('sources', {
    title,
    category: category || 'specs_protocols',
    url,
    repo_url: repo_url || '',
    author: author || 'Community',
    license: license || 'Open Source',
    year: year || '2025-2026',
    tags: tags || ['source'],
    tokens_est: Math.ceil((excerpt || '').length / 4) + 500,
    excerpt: excerpt || '',
    canonical_schema: canonical_schema || 'Standard Markdown Specification',
    target_registries: target_registries || ['prompts', 'skills']
  });

  res.status(201).json({ success: true, data: newSource });
});

// Update source
router.put('/:id', (req, res) => {
  const updated = db.update('sources', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Source not found' });
  }
  res.json({ success: true, data: updated });
});

// Delete source
router.delete('/:id', (req, res) => {
  const success = db.delete('sources', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Source not found' });
  }
  res.json({ success: true, message: 'Source deleted successfully' });
});

// Convert Source into Target Artifact (Prompt, Skill, Workflow, MCP, or Rule)
router.post('/:id/convert', (req, res) => {
  const source = db.getById('sources', req.params.id);
  if (!source) {
    return res.status(404).json({ success: false, error: 'Source not found' });
  }

  const { targetType } = req.body; // 'prompts' | 'skills' | 'workflows' | 'mcp_servers' | 'rules'
  let createdArtifact = null;

  if (targetType === 'prompts') {
    createdArtifact = db.create('prompts', {
      title: `${source.title} (Template)`,
      description: `Generated from source: ${source.title} (${source.url})`,
      category: 'prompts',
      model: 'claude-3-7-sonnet',
      tags: [...(source.tags || []), 'converted-source'],
      source_ref: source.id,
      variables: [
        { name: "INPUT_CONTEXT", defaultValue: "Sample context payload", description: "Context from source" },
        { name: "TASK_DIRECTIVE", defaultValue: "Analyze and execute according to specification", description: "Task objective" }
      ],
      template: `# System Directive based on ${source.title}\n\nReference: ${source.url}\n\nContext:\n{{INPUT_CONTEXT}}\n\nTask:\n{{TASK_DIRECTIVE}}`
    });
  } else if (targetType === 'skills') {
    const slug = source.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    createdArtifact = db.create('skills', {
      name: slug,
      title: source.title,
      category: 'skills',
      description: source.excerpt || source.title,
      tags: [...(source.tags || []), 'converted-skill'],
      author: source.author || 'Sources Hub',
      source_ref: source.id,
      entry_file: 'SKILL.md',
      tools_required: ['view_file', 'run_command'],
      content: `---\nname: ${slug}\ndescription: ${source.excerpt || source.title}\n---\n\n# ${source.title}\n\n> Source: ${source.url}\n\n## Instructions\n1. Follow specification protocols from [${source.title}](${source.url})\n2. Execute required tools\n`
    });
  } else if (targetType === 'workflows') {
    createdArtifact = db.create('workflows', {
      title: `${source.title} Pipeline DAG`,
      category: 'workflows',
      description: `Automated execution graph based on ${source.title}`,
      tags: [...(source.tags || []), 'pipeline'],
      status: 'READY',
      source_ref: source.id,
      nodes: [
        { id: 'step_1', type: 'dataset', label: 'Ingest Source Spec', refId: source.id, status: 'READY', x: 100, y: 150 },
        { id: 'step_2', type: 'code', label: 'Processing & Verification', refId: null, status: 'READY', x: 380, y: 150 },
        { id: 'step_3', type: 'security', label: 'Policy Verification', refId: null, status: 'READY', x: 660, y: 150 }
      ],
      edges: [
        { from: 'step_1', to: 'step_2', label: 'Spec Ingested' },
        { from: 'step_2', to: 'step_3', label: 'Verified' }
      ]
    });
  } else if (targetType === 'mcp_servers') {
    const serverName = source.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    createdArtifact = db.create('mcp_servers', {
      name: serverName,
      title: source.title,
      category: 'mcp_servers',
      description: source.excerpt || source.title,
      transport: 'stdio',
      command: 'npx',
      args: ['-y', `@modelcontextprotocol/${serverName}`],
      status: 'ONLINE',
      source_ref: source.id,
      tags: [...(source.tags || []), 'mcp'],
      tools: [
        { name: 'inspect', description: `Inspect parameters for ${source.title}`, parameters: {} }
      ]
    });
  } else if (targetType === 'rules') {
    createdArtifact = db.create('rules', {
      title: `${source.title} Guardrail Directive`,
      category: 'rules',
      description: source.excerpt || source.title,
      target_file: 'AGENTS.md',
      priority: 'HIGH',
      tags: [...(source.tags || []), 'protocol-guardrail'],
      source_ref: source.id,
      content: `# ${source.title} Protocol\n\nReference: ${source.url}\n\n1. Invariant: Adhere to specification standards.\n2. Invariant: Maintain schema integrity.\n`
    });
  } else {
    return res.status(400).json({ success: false, error: 'Invalid targetType' });
  }

  res.status(201).json({
    success: true,
    message: `Source converted into ${targetType} artifact`,
    targetType,
    artifact: createdArtifact
  });
});

// Export active.json & all.json
router.get('/export/active.json', (req, res) => {
  const sources = db.getCollection('sources');
  res.setHeader('Content-Disposition', 'attachment; filename="active.json"');
  res.json({
    manifest: "Prompt Ops Control Tower - Active Sources Catalog",
    exported_at: new Date().toISOString(),
    count: sources.length,
    sources
  });
});

router.get('/export/all.json', (req, res) => {
  const sources = db.getCollection('sources');
  res.setHeader('Content-Disposition', 'attachment; filename="all.json"');
  res.json({
    manifest: "Prompt Ops Control Tower - Complete Knowledge Base",
    exported_at: new Date().toISOString(),
    total_sources: sources.length,
    sources
  });
});

// Export active.md & all.md (Prompt Register Dense TUI Format)
router.get('/export/active.md', (req, res) => {
  const sources = db.getCollection('sources');
  let md = `# PROMPT OPS SOURCES CATALOG (ACTIVE.MD)\n\n`;
  md += `> Generated on ${new Date().toISOString()} by Prompt Ops Control Tower (artefactory)\n\n`;
  md += `| ID | Title | Category | License | Tokens Est | Canonical URL |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  sources.forEach(s => {
    md += `| \`${s.id}\` | **${s.title}** | \`${s.category}\` | ${s.license} | ~${s.tokens_est} | [Link](${s.url}) |\n`;
  });

  md += `\n\n## Excerpts & Canonical Protocols\n\n`;
  sources.forEach(s => {
    md += `### [${s.id}] ${s.title}\n`;
    md += `- **Category:** ${s.categoryLabel || s.category} | **Year:** ${s.year} | **License:** ${s.license}\n`;
    md += `- **URL:** ${s.url} ${s.repo_url ? `| **Repo:** ${s.repo_url}` : ''}\n`;
    md += `- **Schema:** \`${s.canonical_schema || 'Standard'}\`\n`;
    md += `- **Excerpt:** ${s.excerpt}\n\n`;
    md += `---\n\n`;
  });

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="active.md"');
  res.send(md);
});

router.get('/export/all.md', (req, res) => {
  const sources = db.getCollection('sources');
  const prompts = db.getCollection('prompts');
  const skills = db.getCollection('skills');
  const workflows = db.getCollection('workflows');
  const mcp = db.getCollection('mcp_servers');
  const rules = db.getCollection('rules');

  let md = `# PROMPT OPS CONTROL TOWER - COMPLETE DENSE REGISTRY (ALL.MD)\n\n`;
  md += `> Full ecosystem export: ${new Date().toISOString()}\n\n`;

  md += `## 1. Sources Catalog (${sources.length} items)\n\n`;
  sources.forEach(s => {
    md += `- **${s.title}** (\`${s.category}\`): [${s.url}](${s.url})\n`;
  });

  md += `\n## 2. Prompts Registry (${prompts.length} templates)\n\n`;
  prompts.forEach(p => {
    md += `### ${p.title} (v${p.version})\n\`\`\`\n${p.template}\n\`\`\`\n\n`;
  });

  md += `\n## 3. Skills Registry (${skills.length} skills)\n\n`;
  skills.forEach(sk => {
    md += `### ${sk.title} (\`${sk.name}\`)\n\`\`\`markdown\n${sk.content}\n\`\`\`\n\n`;
  });

  md += `\n## 4. MCP Servers (${mcp.length} servers)\n\n`;
  mcp.forEach(m => {
    md += `- **${m.title}** (${m.transport}): \`${m.command || m.endpoint_url}\` [${(m.tools || []).length} tools]\n`;
  });

  md += `\n## 5. Rules & Guardrails (${rules.length} directives)\n\n`;
  rules.forEach(r => {
    md += `### [${r.priority}] ${r.title}\n${r.content}\n\n`;
  });

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="all.md"');
  res.send(md);
});

export default router;
