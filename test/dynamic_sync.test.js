import assert from 'node:assert/strict';
import { db } from '../server/db.js';
import { ingestionEngine } from '../server/ingestion_engine.js';

async function runTests() {
  console.log('🧪 Testing Ingestion Engine & Dynamic Harvesting...\n');

  // 1. Check sources initialized
  const sources = db.getCollection('sources');
  assert.ok(sources.length >= 10, 'Sources collection should contain at least 10 canonical sources');
  console.log(`✅ 1. Sources initialized (${sources.length} canonical sources)`);

  // 2. Test syncSource on MCP spec
  const mcpSync = await ingestionEngine.syncSource('src_mcp_spec');
  assert.ok(mcpSync.created || mcpSync.updated, 'syncSource should return created or updated statistics');
  console.log('✅ 2. syncSource(src_mcp_spec) succeeded:', mcpSync);

  // 3. Test syncAll
  const syncReport = await ingestionEngine.syncAll();
  assert.equal(syncReport.success, true, 'syncAll should succeed');
  assert.ok(syncReport.totals.sources_scanned >= 10, 'Should have scanned all sources');
  assert.ok(syncReport.logs.length > 5, 'Should have generated terminal execution logs');
  console.log('✅ 3. syncAll succeeded:', syncReport.totals);

  // 4. Verify that artifacts were created in DB
  const prompts = db.getCollection('prompts');
  const skills = db.getCollection('skills');
  const workflows = db.getCollection('workflows');
  const mcpServers = db.getCollection('mcp_servers');
  const rules = db.getCollection('rules');

  console.log(`\n📊 Harvested Database Inventory:`);
  console.log(`- Prompts: ${prompts.length}`);
  console.log(`- Skills: ${skills.length}`);
  console.log(`- Workflows: ${workflows.length}`);
  console.log(`- MCP Servers: ${mcpServers.length}`);
  console.log(`- Rules: ${rules.length}`);

  assert.ok(prompts.length >= 4, 'Prompts count should be enriched');
  assert.ok(skills.length >= 4, 'Skills count should be enriched');
  assert.ok(workflows.length >= 3, 'Workflows count should be enriched');
  assert.ok(mcpServers.length >= 4, 'MCP servers count should be enriched');
  assert.ok(rules.length >= 3, 'Rules count should be enriched');

  // 5. Verify Omni-Search matches harvested items
  const dspySearch = db.omniSearch('dspy');
  assert.ok(dspySearch.length > 0, 'OmniSearch should find DSPy artifacts');
  console.log(`✅ 5. OmniSearch query "dspy" matched ${dspySearch.length} items`);

  console.log('\n🎉 ALL DYNAMIC INGESTION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
