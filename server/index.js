import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import promptsRouter from './routes/prompts.js';
import skillsRouter from './routes/skills.js';
import workflowsRouter from './routes/workflows.js';
import mcpRouter from './routes/mcp.js';
import rulesRouter from './routes/rules.js';
import searchRouter from './routes/search.js';
import systemRouter from './routes/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.join(__dirname, '..', 'client');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${req.method}] ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/prompts', promptsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/search', searchRouter);
app.use('/api/system', systemRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Prompt Ops Control Tower (artefactory)',
    timestamp: new Date().toISOString(),
    version: '2.0.0-prod'
  });
});

// Serve Client static files
app.use(express.static(CLIENT_DIR));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Prompt Ops Control Tower (artefactory) v2.0.0`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`🌐 API Ready on http://localhost:${PORT}/api/`);
  console.log(`====================================================`);
});

export default app;
