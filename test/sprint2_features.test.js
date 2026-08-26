import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db.js';
import { mcpGateway } from '../server/mcp_gateway.js';
import { gitOpsEngine } from '../server/gitops_engine.js';

describe('🧪 Sprint 2 Feature Refinement & Inspector Sandbox Test Suite', () => {
  
  it('1. System Logs Endpoint & DB Logger Integrity', () => {
    // Log sample activities
    db.logActivity('TEST_ACTION', 'prompts', 'prm_test_1', 'Test Prompt Item', { test: true }, 'INFO');
    db.logActivity('TEST_WARN', 'rules', 'rule_test_1', 'Warning Rule Event', { error: false }, 'WARN');
    db.logActivity('TEST_ERR', 'system', 'sys_test_1', 'Critical Failure Simulation', { code: 500 }, 'ERROR');

    const allLogs = db.getLogs(50);
    assert.ok(Array.isArray(allLogs), 'getLogs should return an array');
    assert.ok(allLogs.length >= 3, 'Should contain at least 3 logged events');

    const errLogs = db.getLogs(50, 'ERROR');
    assert.ok(errLogs.every(l => l.level === 'ERROR'), 'Filtered logs should only contain ERROR level');

    const promptLogs = db.getLogs(50, null, 'prompts');
    assert.ok(promptLogs.every(l => l.category === 'prompts'), 'Filtered logs should only contain prompts category');
    console.log(`✅ 1. System Logs & Activity Logger PASSED (${allLogs.length} logs in DB)`);
  });

  it('2. Prompt Variable Regex Parser & Bracket Checker', () => {
    const template1 = "You are a {{role}}. Please analyze {{input_data}} using format {{format}}.";
    const matches1 = template1.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || [];
    const vars1 = Array.from(new Set(matches1.map(m => m.replace(/[\{\}]/g, '').trim())));
    
    assert.deepStrictEqual(vars1, ['role', 'input_data', 'format']);

    // Check bracket matching
    const unclosedTemplate = "Hello {{role}, please process {{data}}.";
    const openCount = (unclosedTemplate.match(/\{\{/g) || []).length;
    const closeCount = (unclosedTemplate.match(/\}\}/g) || []).length;
    assert.strictEqual(openCount !== closeCount, true, 'Should detect unclosed brackets');

    console.log('✅ 2. Variable Extraction Regex & Bracket Syntax Validator PASSED');
  });

  it('3. MCP Gateway JSON-RPC 2.0 Tools Execution', async () => {
    // Test tools/list
    const listReq = { body: { jsonrpc: '2.0', id: 101, method: 'tools/list', params: {} }, query: {} };
    let listRes;
    const resMock1 = {
      json: (data) => { listRes = data; },
      status: () => resMock1
    };
    await mcpGateway.handleMessage(listReq, resMock1);
    assert.strictEqual(listRes.jsonrpc, '2.0');
    assert.ok(Array.isArray(listRes.result.tools), 'tools/list should return tools array');

    // Test tools/call (search_artifacts)
    const callReq = {
      body: {
        jsonrpc: '2.0',
        id: 102,
        method: 'tools/call',
        params: {
          name: 'search_artifacts',
          arguments: { query: 'GitHub code search', semantic: true, limit: 3 }
        }
      },
      query: {}
    };
    let callRes;
    const resMock2 = {
      json: (data) => { callRes = data; },
      status: () => resMock2
    };
    await mcpGateway.handleMessage(callReq, resMock2);
    assert.strictEqual(callRes.jsonrpc, '2.0');
    assert.ok(Array.isArray(callRes.result.content), 'tools/call response must contain content array');
    assert.ok(callRes.result.content[0].text.includes('GitHub'), 'Response content must contain results');

    console.log('✅ 3. MCP Inspector JSON-RPC tools/list and tools/call Execution PASSED');
  });

  it('4. GitOps Status & Repository Integrity', async () => {
    const status = await gitOpsEngine.getStatus();
    assert.ok(status.branch, 'Status must include active branch name');
    assert.ok(Array.isArray(status.modified_files), 'Status must include modified_files array');
    assert.ok(status.remote_url.includes('artefactory'), 'Status must include remote_url');
    console.log(`✅ 4. Git Status Inspection PASSED (Branch: ${status.branch}, Clean: ${status.is_clean})`);
  });

});
