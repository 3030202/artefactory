import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all prompts
router.get('/', (req, res) => {
  const { tag, search, model } = req.query;
  let prompts = db.getAll('prompts', { tag, search });
  if (model) {
    prompts = prompts.filter(p => p.model && p.model.toLowerCase().includes(model.toLowerCase()));
  }
  res.json({ success: true, data: prompts, count: prompts.length });
});

// Get single prompt
router.get('/:id', (req, res) => {
  const prompt = db.getById('prompts', req.params.id);
  if (!prompt) {
    return res.status(404).json({ success: false, error: 'Prompt not found' });
  }
  res.json({ success: true, data: prompt });
});

// Create prompt
router.post('/', (req, res) => {
  const { title, description, template, variables, tags, model, temperature, max_tokens } = req.body;
  if (!title || !template) {
    return res.status(400).json({ success: false, error: 'Title and template are required' });
  }

  // Auto-detect {{variable}} from template if not provided
  let detectedVars = variables;
  if (!detectedVars || detectedVars.length === 0) {
    const matches = [...new Set(template.match(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g) || [])];
    detectedVars = matches.map(m => {
      const name = m.replace(/{{\s*|\s*}}/g, '');
      return { name, defaultValue: '', description: `Variable ${name}` };
    });
  }

  const newPrompt = db.create('prompts', {
    title,
    category: 'prompts',
    description: description || '',
    template,
    variables: detectedVars,
    tags: tags || [],
    model: model || 'claude-3-7-sonnet',
    temperature: typeof temperature === 'number' ? temperature : 0.7,
    max_tokens: max_tokens || 4000
  });

  res.status(201).json({ success: true, data: newPrompt });
});

// Update prompt
router.put('/:id', (req, res) => {
  const updated = db.update('prompts', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Prompt not found' });
  }
  res.json({ success: true, data: updated });
});

// Delete prompt
router.delete('/:id', (req, res) => {
  const success = db.delete('prompts', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Prompt not found' });
  }
  res.json({ success: true, message: 'Prompt deleted successfully' });
});

// Test / Play with Prompt (inject variables, calculate token estimate)
router.post('/:id/test', (req, res) => {
  const prompt = db.getById('prompts', req.params.id);
  if (!prompt) {
    return res.status(404).json({ success: false, error: 'Prompt not found' });
  }

  const userVars = req.body.variables || {};
  let rendered = prompt.template;

  // Substitute variables
  (prompt.variables || []).forEach(v => {
    const val = userVars[v.name] !== undefined ? userVars[v.name] : (v.defaultValue || `[MISSING: ${v.name}]`);
    const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, 'g');
    rendered = rendered.replace(regex, val);
  });

  // Basic token estimation (~4 chars per token)
  const tokenEstimate = Math.ceil(rendered.length / 4);

  res.json({
    success: true,
    data: {
      original_template: prompt.template,
      rendered_prompt: rendered,
      token_estimate: tokenEstimate,
      characters: rendered.length,
      model: prompt.model,
      temperature: prompt.temperature
    }
  });
});

// Diff history versions
router.get('/:id/history', (req, res) => {
  const prompt = db.getById('prompts', req.params.id);
  if (!prompt) {
    return res.status(404).json({ success: false, error: 'Prompt not found' });
  }
  res.json({ success: true, history: prompt.history || [] });
});

export default router;
