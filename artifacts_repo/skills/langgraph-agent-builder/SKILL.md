---
name: langgraph-agent-builder
description: Scaffolds LangGraph StateGraphs with conditional branching, node execution functions, and checkpoint persistence.
---

# LangGraph Multi-Agent Builder

## Architecture Invariants
- Use `TypedDict` for explicit State schema.
- Define nodes as pure async functions returning partial state dicts.
- Route dynamic flows via `workflow.add_conditional_edges()`.