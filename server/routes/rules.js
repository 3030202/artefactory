import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all rules
router.get('/', (req, res) => {
  const { tag, search, priority } = req.query;
  let rules = db.getAll('rules', { tag, search });
  if (priority) {
    rules = rules.filter(r => r.priority === priority);
  }
  res.json({ success: true, data: rules, count: rules.length });
});

// Get single rule
router.get('/:id', (req, res) => {
  const rule = db.getById('rules', req.params.id);
  if (!rule) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }
  res.json({ success: true, data: rule });
});

// Create rule
router.post('/', (req, res) => {
  const { title, description, content, tags, target_file, priority } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required' });
  }

  const newRule = db.create('rules', {
    title,
    category: 'rules',
    description: description || '',
    content,
    tags: tags || ['guidelines'],
    target_file: target_file || 'AGENTS.md',
    priority: priority || 'MEDIUM'
  });

  res.status(201).json({ success: true, data: newRule });
});

// Update rule
router.put('/:id', (req, res) => {
  const updated = db.update('rules', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }
  res.json({ success: true, data: updated });
});

// Delete rule
router.delete('/:id', (req, res) => {
  const success = db.delete('rules', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }
  res.json({ success: true, message: 'Rule deleted successfully' });
});

// Compile active rules into a consolidated System Prompt or AGENTS.md document
router.get('/compile/system-prompt', (req, res) => {
  const rules = db.getCollection('rules');
  const sortedRules = [...rules].sort((a, b) => {
    const pOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
    return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
  });

  let compiled = `# SYSTEM DIRECTIVES & OPERATIONAL PROTOCOLS\n\n`;
  compiled += `> Compiled on ${new Date().toISOString()} by Prompt Ops Control Tower (artefactory)\n\n`;

  sortedRules.forEach((r, idx) => {
    compiled += `## ${idx + 1}. [${r.priority}] ${r.title}\n`;
    compiled += `*Target file: ${r.target_file} | Version: ${r.version}*\n\n`;
    compiled += `${r.content}\n\n`;
    compiled += `---\n\n`;
  });

  res.json({
    success: true,
    rules_count: sortedRules.length,
    compiled_markdown: compiled
  });
});

export default router;
