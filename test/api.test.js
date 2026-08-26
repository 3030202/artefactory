import assert from 'node:assert';
import test from 'node:test';
import { db } from '../server/db.js';

test('Database Initialization & Seed Integrity', async (t) => {
  db.resetToSeed();

  const prompts = db.getAll('prompts');
  const skills = db.getAll('skills');
  const workflows = db.getAll('workflows');
  const mcp = db.getAll('mcp_servers');
  const rules = db.getAll('rules');

  assert.ok(prompts.length >= 3, 'Should have at least 3 seed prompts');
  assert.ok(skills.length >= 3, 'Should have at least 3 seed skills');
  assert.ok(workflows.length >= 2, 'Should have at least 2 seed workflows');
  assert.ok(mcp.length >= 3, 'Should have at least 3 seed MCP servers');
  assert.ok(rules.length >= 2, 'Should have at least 2 seed rules');
});

test('Omni-Search Engine Across Categories', async (t) => {
  const allResults = db.omniSearch('architecture');
  assert.ok(allResults.length > 0, 'Should find items matching "architecture"');

  const promptResults = db.omniSearch('spec', 'prompts');
  assert.ok(promptResults.length > 0, 'Should find prompt items with spec query');
  assert.strictEqual(promptResults[0].category, 'prompts');

  const mcpResults = db.omniSearch('filesystem', 'mcp_servers');
  assert.ok(mcpResults.length > 0, 'Should find MCP server items matching "filesystem"');
});

test('Prompts CRUD & Versioning', async (t) => {
  // Create
  const created = db.create('prompts', {
    title: 'Test Unit Prompt',
    category: 'prompts',
    template: 'Hello {{NAME}}, execute {{TASK}}',
    tags: ['test']
  });
  assert.ok(created.id, 'Created prompt should have an ID');
  assert.strictEqual(created.version, '1.0.0');

  // Update
  const updated = db.update('prompts', created.id, {
    template: 'Hello {{NAME}}, execute modified {{TASK}}'
  });
  assert.ok(updated, 'Prompt should be updated');
  assert.strictEqual(updated.version, '1.0.1');
  assert.strictEqual(updated.history.length, 2, 'Should maintain version history');

  // Delete
  const deleted = db.delete('prompts', created.id);
  assert.strictEqual(deleted, true, 'Prompt should be deleted');
  assert.strictEqual(db.getById('prompts', created.id), undefined);
});

test('Skills Frontmatter Validation', async (t) => {
  const validYamlSkill = `---
name: custom-test-skill
description: Tests automated execution of unit routines.
---

# Custom Test Skill
Instruction lines...`;

  const invalidYamlSkill = `# Missing Frontmatter
Only body content`;

  const parseSkill = (content) => {
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
    if (!match) return { valid: false };
    const yaml = match[1];
    return { valid: yaml.includes('name:') && yaml.includes('description:') };
  };

  assert.strictEqual(parseSkill(validYamlSkill).valid, true);
  assert.strictEqual(parseSkill(invalidYamlSkill).valid, false);
});
