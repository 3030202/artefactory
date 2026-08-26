import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { q, category } = req.query;
  const results = db.omniSearch(q || '', category || 'all');
  res.json({
    success: true,
    query: q || '',
    category: category || 'all',
    count: results.length,
    results
  });
});

export default router;
