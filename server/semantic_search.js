import { db } from './db.js';

export class SemanticSearchEngine {
  constructor() {
    this.vectorIndex = new Map(); // id -> { item, category, vector, magnitude }
    this.vocabulary = new Map();  // term -> term_index
    this.idf = new Map();         // term -> idf weight
    this.isIndexed = false;
    this.lastIndexedAt = null;
  }

  // Tokenize text into words, bi-grams and subwords (handles EN and RU)
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Normalize and clean
    const clean = text.toLowerCase()
      .replace(/[^\p{L}\p{N}\s_#-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ').filter(w => w.length >= 2);
    const tokens = new Set(words);

    // Add bi-grams for semantic phrases
    for (let i = 0; i < words.length - 1; i++) {
      tokens.add(`${words[i]}_${words[i + 1]}`);
    }

    // Add 3-4 char subword n-grams for typo-tolerance and stem matching
    for (const w of words) {
      if (w.length >= 4 && w.length <= 12) {
        for (let i = 0; i <= w.length - 3; i++) {
          tokens.add(w.slice(i, i + 3));
        }
      }
    }

    return Array.from(tokens);
  }

  // Rebuild the semantic vector index across all database collections
  rebuildIndex() {
    this.vectorIndex.clear();
    this.vocabulary.clear();
    this.idf.clear();

    const collections = [
      { name: 'sources', items: db.getCollection('sources'), typeLabel: 'Source' },
      { name: 'prompts', items: db.getCollection('prompts'), typeLabel: 'Prompt' },
      { name: 'skills', items: db.getCollection('skills'), typeLabel: 'Skill' },
      { name: 'workflows', items: db.getCollection('workflows'), typeLabel: 'Workflow' },
      { name: 'mcp_servers', items: db.getCollection('mcp_servers'), typeLabel: 'MCP Server' },
      { name: 'rules', items: db.getCollection('rules'), typeLabel: 'Rule / Policy' }
    ];

    const documents = [];
    const docTermFreqs = [];

    // 1. Gather all documents and extract text
    for (const col of collections) {
      for (const item of col.items) {
        const textParts = [
          item.title || '',
          item.name || '',
          item.description || '',
          item.excerpt || '',
          item.category || '',
          item.model || '',
          item.priority || '',
          (item.tags || []).join(' '),
          item.template ? item.template.slice(0, 500) : '',
          item.content ? item.content.slice(0, 500) : ''
        ];

        const fullText = textParts.join(' ');
        const tokens = this.tokenize(fullText);
        
        const termFreq = new Map();
        for (const token of tokens) {
          termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }

        documents.push({ id: item.id, item, category: col.name, typeLabel: col.typeLabel, tokens });
        docTermFreqs.push({ id: item.id, termFreq });
      }
    }

    const N = documents.length;
    if (N === 0) return;

    // 2. Compute Document Frequency (DF) & IDF
    const docFreq = new Map();
    for (const { termFreq } of docTermFreqs) {
      for (const term of termFreq.keys()) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    let vocabIndex = 0;
    for (const [term, df] of docFreq.entries()) {
      this.vocabulary.set(term, vocabIndex++);
      this.idf.set(term, Math.log((N + 1) / (df + 0.5)) + 1.0);
    }

    // 3. Build TF-IDF dense/sparse vector for each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const { termFreq } = docTermFreqs[i];
      const vector = new Map(); // termIndex -> weight
      let sumSquares = 0;

      for (const [term, count] of termFreq.entries()) {
        const termIdx = this.vocabulary.get(term);
        const idfWeight = this.idf.get(term) || 1.0;
        const tf = Math.sqrt(count);
        const weight = tf * idfWeight;

        vector.set(termIdx, weight);
        sumSquares += weight * weight;
      }

      const magnitude = Math.sqrt(sumSquares) || 1.0;
      this.vectorIndex.set(doc.id, {
        item: doc.item,
        category: doc.category,
        typeLabel: doc.typeLabel,
        vector,
        magnitude
      });
    }

    this.isIndexed = true;
    this.lastIndexedAt = new Date().toISOString();
    console.log(`[SemanticSearch] Indexed ${this.vectorIndex.size} artifacts across ${this.vocabulary.size} semantic features.`);
  }

  // Query the index using semantic vector cosine similarity
  search(query, options = {}) {
    if (!this.isIndexed || this.vectorIndex.size === 0) {
      this.rebuildIndex();
    }

    const { category = 'all', limit = 10, minScore = 0.05 } = options;
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    // Build query vector
    const queryVector = new Map();
    let querySumSquares = 0;

    for (const token of queryTokens) {
      const termIdx = this.vocabulary.get(token);
      if (termIdx !== undefined) {
        const idfWeight = this.idf.get(token) || 1.0;
        const weight = 1.0 * idfWeight;
        queryVector.set(termIdx, (queryVector.get(termIdx) || 0) + weight);
      }
    }

    for (const weight of queryVector.values()) {
      querySumSquares += weight * weight;
    }

    const queryMagnitude = Math.sqrt(querySumSquares) || 1.0;
    const scores = [];

    // Calculate Cosine Similarity with all documents in index
    for (const [id, docEntry] of this.vectorIndex.entries()) {
      if (category !== 'all' && docEntry.category !== category) {
        continue;
      }

      let dotProduct = 0;
      for (const [termIdx, qWeight] of queryVector.entries()) {
        const docWeight = docEntry.vector.get(termIdx);
        if (docWeight) {
          dotProduct += qWeight * docWeight;
        }
      }

      const cosineSimilarity = dotProduct / (queryMagnitude * docEntry.magnitude);

      if (cosineSimilarity >= minScore) {
        // Find matching keywords for highlighting
        const matchedKeywords = queryTokens.filter(t => docEntry.item && (
          (docEntry.item.title && docEntry.item.title.toLowerCase().includes(t)) ||
          (docEntry.item.description && docEntry.item.description.toLowerCase().includes(t)) ||
          (docEntry.item.tags && docEntry.item.tags.some(tag => tag.toLowerCase().includes(t)))
        ));

        scores.push({
          id,
          score: Math.min(1.0, Math.round(cosineSimilarity * 100) / 100),
          relevancePercent: Math.min(100, Math.round(cosineSimilarity * 100)),
          category: docEntry.category,
          typeLabel: docEntry.typeLabel,
          title: docEntry.item.title || docEntry.item.name || id,
          description: docEntry.item.description || docEntry.item.excerpt || '',
          version: docEntry.item.version || '',
          tags: docEntry.item.tags || [],
          matchedKeywords: Array.from(new Set(matchedKeywords)),
          item: docEntry.item
        });
      }
    }

    // Sort descending by relevance score
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }
}

export const semanticSearchEngine = new SemanticSearchEngine();
