import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialSeedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export class Database {
  constructor() {
    this.data = {
      sources: [],
      prompts: [],
      skills: [],
      workflows: [],
      mcp_servers: [],
      rules: [],
      logs: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure sources exist in loaded DB
        if (!this.data.sources || this.data.sources.length === 0) {
          this.data.sources = initialSeedData.sources || [];
          this.save();
        }
      } catch (err) {
        console.error('Error reading db.json, restoring from seed:', err);
        this.resetToSeed();
      }
    } else {
      this.resetToSeed();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `db_backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(this.data, null, 2), 'utf-8');
    return backupPath;
  }

  resetToSeed() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.save();
    console.log('Database initialized with seed data.');
  }

  logActivity(action, category, itemId, itemTitle, details = {}) {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      category,
      itemId,
      itemTitle,
      details
    };
    if (!this.data.logs) this.data.logs = [];
    this.data.logs.unshift(logEntry);
    if (this.data.logs.length > 500) {
      this.data.logs = this.data.logs.slice(0, 500);
    }
    this.save();
    return logEntry;
  }

  // Generic Collection Helpers
  getCollection(name) {
    return this.data[name] || [];
  }

  getAll(collection, filter = {}) {
    let items = this.getCollection(collection);
    
    if (filter.category && collection === 'sources') {
      items = items.filter(i => i.category === filter.category);
    }
    if (filter.tag) {
      const tagLower = filter.tag.toLowerCase();
      items = items.filter(i => (i.tags || []).some(t => t.toLowerCase() === tagLower));
    }
    if (filter.status) {
      items = items.filter(i => i.status === filter.status);
    }
    if (filter.year && collection === 'sources') {
      items = items.filter(i => i.year && i.year.includes(filter.year));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(i => 
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.excerpt && i.excerpt.toLowerCase().includes(q)) ||
        (i.content && typeof i.content === 'string' && i.content.toLowerCase().includes(q)) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return items;
  }

  getById(collection, id) {
    const items = this.getCollection(collection);
    return items.find(item => item.id === id);
  }

  create(collection, itemData) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const id = itemData.id || `${collection.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newItem = {
      ...itemData,
      id,
      version: itemData.version || '1.0.0',
      created_at: now,
      updated_at: now,
      history: [
        {
          version: itemData.version || '1.0.0',
          timestamp: now,
          note: 'Initial creation',
          content_snapshot: itemData.content || itemData.template || itemData.excerpt || itemData.definition || null
        }
      ]
    };
    this.data[collection].unshift(newItem);
    this.save();
    this.logActivity('CREATE', collection, newItem.id, newItem.title || newItem.name);
    return newItem;
  }

  update(collection, id, patchData) {
    const items = this.getCollection(collection);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    const current = items[index];
    const now = new Date().toISOString();
    
    // Bump version minor if content or template changed
    let newVersion = current.version;
    const isContentChanged = 
      (patchData.content !== undefined && patchData.content !== current.content) ||
      (patchData.template !== undefined && patchData.template !== current.template) ||
      (patchData.nodes !== undefined && JSON.stringify(patchData.nodes) !== JSON.stringify(current.nodes)) ||
      (patchData.tools !== undefined && JSON.stringify(patchData.tools) !== JSON.stringify(current.tools)) ||
      (patchData.excerpt !== undefined && patchData.excerpt !== current.excerpt);

    if (isContentChanged && !patchData.version) {
      const parts = (current.version || '1.0.0').split('.');
      if (parts.length === 3) {
        parts[2] = String(Number(parts[2]) + 1);
        newVersion = parts.join('.');
      }
    } else if (patchData.version) {
      newVersion = patchData.version;
    }

    const historyEntry = {
      version: newVersion,
      timestamp: now,
      note: patchData.version_note || 'Update',
      content_snapshot: patchData.content || patchData.template || patchData.excerpt || patchData.definition || current.content
    };

    const updated = {
      ...current,
      ...patchData,
      id: current.id, // prevent ID change
      version: newVersion,
      created_at: current.created_at,
      updated_at: now,
      history: [historyEntry, ...(current.history || [])]
    };

    this.data[collection][index] = updated;
    this.save();
    this.logActivity('UPDATE', collection, updated.id, updated.title || updated.name, { version: newVersion });
    return updated;
  }

  delete(collection, id) {
    const items = this.getCollection(collection);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return false;
    const deleted = items[index];
    this.data[collection].splice(index, 1);
    this.save();
    this.logActivity('DELETE', collection, id, deleted.title || deleted.name);
    return true;
  }

  // Global Omni-Search
  omniSearch(query, categoryFilter = 'all') {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const results = [];

    const searchCollection = (collName, typeLabel, color, icon) => {
      if (categoryFilter !== 'all' && categoryFilter !== collName) return;
      const items = this.getCollection(collName);
      for (const item of items) {
        let score = 0;
        const title = item.title || item.name || '';
        const desc = item.description || item.excerpt || '';
        const content = typeof item.content === 'string' ? item.content : (item.template || JSON.stringify(item.definition || ''));
        const tags = item.tags || [];

        if (title.toLowerCase() === q) score += 100;
        else if (title.toLowerCase().includes(q)) score += 50;
        if (tags.some(t => t.toLowerCase() === q)) score += 40;
        else if (tags.some(t => t.toLowerCase().includes(q))) score += 20;
        if (desc.toLowerCase().includes(q)) score += 15;
        if (content.toLowerCase().includes(q)) score += 10;

        if (score > 0) {
          results.push({
            id: item.id,
            category: collName,
            typeLabel,
            title,
            description: desc,
            tags,
            score,
            color,
            icon,
            version: item.version,
            url: item.url || null,
            updated_at: item.updated_at
          });
        }
      }
    };

    searchCollection('sources', 'Source / Spec', 'var(--cat-sources, #3b82f6)', 'book-open');
    searchCollection('prompts', 'Prompt', 'var(--cat-prompts)', 'terminal');
    searchCollection('skills', 'Skill', 'var(--cat-skills)', 'sparkles');
    searchCollection('workflows', 'Workflow DAG', 'var(--cat-workflows)', 'git-merge');
    searchCollection('mcp_servers', 'MCP Server', 'var(--cat-mcp)', 'cpu');
    searchCollection('rules', 'Rule / Directive', 'var(--cat-rules)', 'shield-alert');

    return results.sort((a, b) => b.score - a.score);
  }

  getStats() {
    return {
      sources_count: (this.data.sources || []).length,
      prompts_count: (this.data.prompts || []).length,
      skills_count: (this.data.skills || []).length,
      workflows_count: (this.data.workflows || []).length,
      mcp_servers_count: (this.data.mcp_servers || []).length,
      rules_count: (this.data.rules || []).length,
      recent_logs: (this.data.logs || []).slice(0, 10),
      last_updated: new Date().toISOString()
    };
  }
}

export const db = new Database();
