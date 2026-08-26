---
name: mcp-server-inspector
description: Validates MCP servers, inspects exposed tools, resources, and prompt templates, and executes live diagnostic tests over Stdio/SSE transports.
---

# MCP Server Inspector & Tool Validator

## Operational Workflow
1. **Handshake**: Execute JSON-RPC `initialize` method with client capabilities.
2. **Discovery**: Call `tools/list` and `resources/list` to extract schemas.
3. **Validation**: Verify that tool parameters adhere strictly to JSON Schema 2020-12.
4. **Execution**: Execute sample parameterized calls and verify response formatting.
