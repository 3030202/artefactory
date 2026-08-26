---
name: mcp-sse-bridge
description: Manages live Server-Sent Events (SSE) transports for distributed MCP servers.
---

# MCP SSE Client Bridge

## Instructions
1. Establish SSE endpoint connection `GET /sse` with authentication tokens.
2. Ingest `endpoint` event to discover target POST RPC endpoint.
3. Multiplex bidirectional JSON-RPC calls through established session token.
