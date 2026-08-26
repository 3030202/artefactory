import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../server/db.js';
import { GitOpsSerializer } from '../server/gitops_serializer.js';
import { gitOpsEngine } from '../server/gitops_engine.js';

async function runGitOpsTests() {
  console.log('🧪 Testing GitOps Engine, Serialization, & Manifest Verification...\n');

  // 1. Test Prompt Serialization / Deserialization
  const prompt = db.getCollection('prompts')[0];
  assert.ok(prompt, 'Should have at least one prompt in DB');
  const serializedPrompt = GitOpsSerializer.serializePrompt(prompt);
  assert.ok(serializedPrompt.includes('---'), 'Serialized prompt should have YAML frontmatter');
  assert.ok(serializedPrompt.includes(prompt.id), 'Serialized prompt should contain id');

  const deserialized = GitOpsSerializer.deserializePrompt(serializedPrompt, prompt.id);
  assert.equal(deserialized.id, prompt.id, 'Deserialized prompt ID should match');
  assert.equal(deserialized.title, prompt.title, 'Deserialized prompt title should match');
  console.log('✅ 1. Prompt serialization & roundtrip deserialization PASSED');

  // 2. Test Manifest Generation
  const manifest = GitOpsSerializer.generateManifest(db);
  assert.ok(manifest.counts.prompts > 0, 'Manifest should have prompts count');
  assert.ok(manifest.manifest_hash, 'Manifest should have computed SHA-256 hash');
  assert.ok(manifest.artifacts.prompts.length > 0, 'Manifest should list prompt files');
  console.log(`✅ 2. Manifest generation PASSED (Hash: ${manifest.manifest_hash}, Items: ${manifest.counts.prompts} prompts, ${manifest.counts.skills} skills)`);

  // 3. Test Export to Workspace Disk
  const exportDir = path.join(process.cwd(), 'data', 'test_gitops_export');
  if (fs.existsSync(exportDir)) fs.rmSync(exportDir, { recursive: true });

  const exportResult = await gitOpsEngine.exportToDisk(exportDir);
  assert.equal(exportResult.success, true, 'Export should succeed');
  assert.ok(exportResult.exported_files_count > 10, 'Should have written over 10 canonical files');
  assert.ok(fs.existsSync(path.join(exportDir, 'manifest.json')), 'manifest.json must exist');
  assert.ok(fs.existsSync(path.join(exportDir, 'rules', 'AGENTS.md')), 'rules/AGENTS.md must exist');
  assert.ok(fs.existsSync(path.join(exportDir, 'mcp', 'mcp_config.json')), 'mcp/mcp_config.json must exist');
  console.log(`✅ 3. Export to Disk PASSED (${exportResult.exported_files_count} files created in ${exportDir})`);

  // Clean test export dir
  fs.rmSync(exportDir, { recursive: true });

  // 4. Test Live Git Status
  const status = await gitOpsEngine.getStatus();
  assert.equal(status.success, true, 'getStatus should return true');
  assert.ok(status.branch, 'Should detect current branch');
  console.log(`✅ 4. Git status inspection PASSED (Branch: ${status.branch}, Remote: ${status.remote_url})`);

  console.log('\n🎉 ALL GITOPS TESTS PASSED 100%!');
}

runGitOpsTests().catch(err => {
  console.error('❌ GitOps test failed:', err);
  process.exit(1);
});
