import assert from 'node:assert/strict';
import { mcpGateway } from '../server/mcp_gateway.js';
import { semanticSearchEngine } from '../server/semantic_search.js';

async function runTests() {
  console.log('🧪 Testing MCP Gateway & Semantic Vector Search...\n');

  // 1. Test Semantic Search Indexing
  semanticSearchEngine.rebuildIndex();
  assert.ok(semanticSearchEngine.vectorIndex.size > 20, 'Should index all database artifacts');
  console.log(`✅ 1. Semantic Vector Index rebuilt (${semanticSearchEngine.vectorIndex.size} documents indexed)`);

  // 2. Test Semantic Search Queries
  const injectionResults = semanticSearchEngine.search('prompt injection defense guardrail and context isolation');
  assert.ok(injectionResults.length > 0, 'Should find security artifacts for injection query');
  assert.ok(injectionResults[0].relevancePercent > 0, 'Should have positive relevance score');
  console.log(`✅ 2. Semantic query "prompt injection defense" matched top item: [${injectionResults[0].id}] "${injectionResults[0].title}" (Score: ${injectionResults[0].relevancePercent}%)`);

  const routerResults = semanticSearchEngine.search('supervisor router multi-agent DAG workflow');
  assert.ok(routerResults.length > 0, 'Should find supervisor DAG');
  console.log(`✅ 3. Semantic query "supervisor router" matched top item: [${routerResults[0].id}] "${routerResults[0].title}" (Score: ${routerResults[0].relevancePercent}%)`);

  // 3. Test MCP Gateway JSON-RPC Methods
  // 3a. Initialize
  const initReq = { body: { method: 'initialize', id: 1 }, query: {} };
  let initResult;
  const initRes = {
    json: (data) => { initResult = data; },
    status: () => initRes
  };
  await mcpGateway.handleMessage(initReq, initRes);
  assert.equal(initResult.result.serverInfo.name, 'artefactory-control-tower');
  console.log('✅ 4. MCP Gateway initialize handshake PASSED');

  // 3b. tools/list
  const toolsReq = { body: { method: 'tools/list', id: 2 }, query: {} };
  let toolsResult;
  const toolsRes = {
    json: (data) => { toolsResult = data; },
    status: () => toolsRes
  };
  await mcpGateway.handleMessage(toolsReq, toolsRes);
  assert.ok(toolsResult.result.tools.length >= 5, 'Should expose at least 5 MCP tools');
  console.log(`✅ 5. MCP Gateway tools/list PASSED (${toolsResult.result.tools.length} tools registered)`);

  // 3c. tools/call search_artifacts
  const callReq = {
    body: {
      method: 'tools/call',
      params: {
        name: 'search_artifacts',
        arguments: { query: 'GitHub code search', semantic: true, limit: 3 }
      },
      id: 3
    },
    query: {}
  };
  let callResult;
  const callRes = {
    json: (data) => { callResult = data; },
    status: () => callRes
  };
  await mcpGateway.handleMessage(callReq, callRes);
  assert.ok(callResult.result.content[0].text.includes('GitHub'), 'Tool execution should return matches');
  console.log('✅ 6. MCP Gateway tools/call search_artifacts PASSED');

  console.log('\n🎉 ALL MCP GATEWAY & SEMANTIC SEARCH TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
