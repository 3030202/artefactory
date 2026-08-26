import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all skills
router.get('/', (req, res) => {
  const { tag, search } = req.query;
  const skills = db.getAll('skills', { tag, search });
  res.json({ success: true, data: skills, count: skills.length });
});

// Get single skill
router.get('/:id', (req, res) => {
  const skill = db.getById('skills', req.params.id);
  if (!skill) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  res.json({ success: true, data: skill });
});

// Helper to parse YAML frontmatter from Markdown
function parseSkillFrontmatter(content) {
  const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return { valid: false, error: 'Missing YAML frontmatter delimiters (--- ... ---)' };
  
  const yamlBlock = match[1];
  const metadata = {};
  yamlBlock.split(/\r?\n/).forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) metadata[key] = val;
    }
  });

  const valid = Boolean(metadata.name && metadata.description);
  return {
    valid,
    metadata,
    error: valid ? null : 'Frontmatter must contain at least "name" and "description" fields.'
  };
}

// Validate SKILL.md content
router.post('/validate', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, error: 'Content is required for validation' });
  }

  const analysis = parseSkillFrontmatter(content);
  res.json({
    success: true,
    valid: analysis.valid,
    metadata: analysis.metadata || {},
    error: analysis.error,
    length: content.length,
    has_instructions: content.length > 50
  });
});

// Create skill
router.post('/', (req, res) => {
  const { name, title, description, content, tags, author, tools_required } = req.body;
  if (!name || !content) {
    return res.status(400).json({ success: false, error: 'Name and SKILL.md content are required' });
  }

  const fm = parseSkillFrontmatter(content);

  const newSkill = db.create('skills', {
    name,
    title: title || name,
    category: 'skills',
    description: description || (fm.metadata ? fm.metadata.description : ''),
    tags: tags || ['custom-skill'],
    author: author || 'Antigravity Operator',
    entry_file: 'SKILL.md',
    tools_required: tools_required || [],
    frontmatter: fm.metadata || { name, description },
    content
  });

  res.status(201).json({ success: true, data: newSkill });
});

// Update skill
router.put('/:id', (req, res) => {
  const updated = db.update('skills', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  res.json({ success: true, data: updated });
});

// Delete skill
router.delete('/:id', (req, res) => {
  const success = db.delete('skills', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  res.json({ success: true, message: 'Skill deleted successfully' });
});

// Export skill as standard .agents/skills directory manifest
router.get('/:id/export', (req, res) => {
  const skill = db.getById('skills', req.params.id);
  if (!skill) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }

  const folderPath = `.agents/skills/${skill.name}`;
  const files = {
    [`${folderPath}/SKILL.md`]: skill.content,
    [`${folderPath}/metadata.json`]: JSON.stringify({
      id: skill.id,
      name: skill.name,
      title: skill.title,
      version: skill.version,
      author: skill.author,
      tools: skill.tools_required,
      exported_at: new Date().toISOString()
    }, null, 2)
  };

  res.json({
    success: true,
    skill_name: skill.name,
    target_path: folderPath,
    files
  });
});

export default router;
