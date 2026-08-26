import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all workflows
router.get('/', (req, res) => {
  const { tag, search, status } = req.query;
  const workflows = db.getAll('workflows', { tag, search, status });
  res.json({ success: true, data: workflows, count: workflows.length });
});

// Get single workflow
router.get('/:id', (req, res) => {
  const wf = db.getById('workflows', req.params.id);
  if (!wf) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: wf });
});

// Create workflow
router.post('/', (req, res) => {
  const { title, description, nodes, edges, tags, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Workflow title is required' });
  }

  const newWf = db.create('workflows', {
    title,
    category: 'workflows',
    description: description || '',
    status: status || 'DRAFT',
    tags: tags || ['custom-dag'],
    nodes: nodes || [
      { id: 'start_node', type: 'trigger', label: 'Start Trigger', icon: 'play-circle', x: 100, y: 150, status: 'READY' }
    ],
    edges: edges || []
  });

  res.status(201).json({ success: true, data: newWf });
});

// Update workflow
router.put('/:id', (req, res) => {
  const updated = db.update('workflows', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: updated });
});

// Delete workflow
router.delete('/:id', (req, res) => {
  const success = db.delete('workflows', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, message: 'Workflow deleted successfully' });
});

// Simulate / Run Workflow execution trace
router.post('/:id/simulate', async (req, res) => {
  const wf = db.getById('workflows', req.params.id);
  if (!wf) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }

  const executionLogs = [];
  const nodes = wf.nodes || [];
  const startTimestamp = Date.now();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const stepDuration = Math.floor(Math.random() * 200) + 50;
    
    executionLogs.push({
      step: i + 1,
      nodeId: node.id,
      label: node.label,
      type: node.type,
      status: 'SUCCESS',
      duration_ms: stepDuration,
      message: `Node [${node.label}] executed successfully with output state verified.`
    });
  }

  const totalDuration = Date.now() - startTimestamp + executionLogs.reduce((acc, l) => acc + l.duration_ms, 0);

  res.json({
    success: true,
    workflow_id: wf.id,
    workflow_title: wf.title,
    total_nodes: nodes.length,
    execution_status: 'SUCCESS',
    total_duration_ms: totalDuration,
    trace: executionLogs
  });
});

export default router;
