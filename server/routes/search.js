import express from 'express';
import { db } from '../db.js';
import { semanticSearchEngine } from '../semantic_search.js';

const router = express.Router();

// GET /api/search - Keyword Omni-Search
router.get('/', (req, res) => {
  const { q, category } = req.query;
  const results = db.omniSearch(q || '', category || 'all');
  res.json({
    success: true,
    mode: 'keyword',
    query: q || '',
    category: category || 'all',
    count: results.length,
    results
  });
});

// POST /api/search/semantic & GET /api/search/semantic - Vector Cosine Search
router.all('/semantic', (req, res) => {
  const q = req.body?.q || req.query?.q || '';
  const category = req.body?.category || req.query?.category || 'all';
  const limit = parseInt(req.body?.limit || req.query?.limit || '12', 10);
  const minScore = parseFloat(req.body?.minScore || req.query?.minScore || '0.12');

  const results = semanticSearchEngine.search(q, { category, limit, minScore });

  res.json({
    success: true,
    mode: 'semantic_vector',
    query: q,
    category,
    count: results.length,
    indexed_at: semanticSearchEngine.lastIndexedAt,
    results
  });
});

// POST /api/search/reindex - Rebuild semantic vector index
router.post('/reindex', (req, res) => {
  semanticSearchEngine.rebuildIndex();
  res.json({
    success: true,
    message: 'Semantic vector index rebuilt successfully',
    indexed_at: semanticSearchEngine.lastIndexedAt,
    documents_indexed: semanticSearchEngine.vectorIndex.size
  });
});

export default router;
