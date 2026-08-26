import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_PATH = path.join(__dirname, '..', '..', 'STATE.json');

const router = express.Router();

// Get System Overview & Stats
router.get('/stats', (req, res) => {
  const stats = db.getStats();
  res.json({ success: true, data: stats });
});

// Get Project State & Lifecycle Phases from STATE.json
router.get('/state', (req, res) => {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const raw = fs.readFileSync(STATE_PATH, 'utf-8');
      const stateObj = JSON.parse(raw);
      return res.json({ success: true, state: stateObj });
    }
  } catch (err) {
    console.error('Error reading STATE.json:', err);
  }
  res.status(500).json({ success: false, error: 'Could not load STATE.json' });
});

// Update Project State / Gate Confirmation
router.post('/state', (req, res) => {
  try {
    const patch = req.body;
    let currentState = {};
    if (fs.existsSync(STATE_PATH)) {
      currentState = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    }
    const updatedState = {
      ...currentState,
      ...patch,
      updated_at: new Date().toISOString()
    };
    fs.writeFileSync(STATE_PATH, JSON.stringify(updatedState, null, 2), 'utf-8');
    db.logActivity('UPDATE', 'system', 'state_json', 'STATE.json updated', patch);
    return res.json({ success: true, state: updatedState });
  } catch (err) {
    console.error('Error writing STATE.json:', err);
    res.status(500).json({ success: false, error: 'Could not update STATE.json' });
  }
});

// Full database backup export
router.get('/export-bundle', (req, res) => {
  const backupFile = db.backup();
  res.json({
    success: true,
    message: 'Backup generated successfully',
    backup_file: backupFile,
    data: db.data
  });
});

// Reset database to initial seed
router.post('/reset-seed', (req, res) => {
  db.resetToSeed();
  res.json({ success: true, message: 'Database reset to initial seed data' });
});

export default router;
