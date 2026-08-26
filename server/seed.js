export const initialSeedData = {
  prompts: [
    {
      id: "prm_arch_spec",
      title: "System Architecture & Tech Spec Generator",
      category: "prompts",
      description: "Generates production-ready RFC/ADR technical specification from raw business requirements.",
      tags: ["architecture", "rfc", "adr", "spec"],
      model: "claude-3-7-sonnet / gemini-2.5-pro",
      temperature: 0.2,
      max_tokens: 4000,
      version: "2.1.0",
      variables: [
        { name: "FEATURE_NAME", defaultValue: "Artifact Registry Engine", description: "Name of the target feature" },
        { name: "TECH_STACK", defaultValue: "Node.js, Express, SQLite, Vanilla CSS Glassmorphism", description: "Target technology stack" },
        { name: "CONSTRAINTS", defaultValue: "Must support standalone offline execution and Docker container", description: "Architecture constraints" }
      ],
      template: `You are a Principal Systems Architect. Design a comprehensive Technical Specification for {{FEATURE_NAME}}.

### Technology Stack:
{{TECH_STACK}}

### Constraints & Invariants:
{{CONSTRAINTS}}

### Output Structure:
1. Executive Summary & Problem Statement
2. High-Level Architecture Diagram (Mermaid)
3. Data Model & Schema Definitions
4. REST API / Protocol Contracts
5. Security, Access Control & Data Isolation
6. Rollout, Migration & Rollback Strategy
7. Verification & Load Testing Plan`,
      created_at: "2026-08-20T10:00:00Z",
      updated_at: "2026-08-25T14:30:00Z"
    },
    {
      id: "prm_code_reviewer",
      title: "Production Code Reviewer & Security Auditor",
      category: "prompts",
      description: "Rigorous code review emphasizing security vulnerabilities, performance bottlenecks, and architectural clarity.",
      tags: ["security", "code-review", "owasp", "performance"],
      model: "gemini-2.5-pro",
      temperature: 0.1,
      max_tokens: 3000,
      version: "1.4.0",
      variables: [
        { name: "LANGUAGE", defaultValue: "JavaScript / TypeScript", description: "Programming language" },
        { name: "CODE_SNIPPET", defaultValue: "const db = req.body.query; eval(db);", description: "Source code to inspect" }
      ],
      template: `You are a Senior Staff Security Engineer and Quality Reviewer.
Analyze the following {{LANGUAGE}} code snippet for:
1. OWASP Top 10 vulnerabilities (Injection, Auth, SSRF, Deserialization)
2. Resource leaks, race conditions, unhandled async promises
3. Adherence to Clean Code & idiomatic patterns

Source Code:
\`\`\`{{LANGUAGE}}
{{CODE_SNIPPET}}
\`\`\`

Format your review with Severity Badges [CRITICAL], [HIGH], [MEDIUM], [INFO] and provide exact drop-in diff fixes.`,
      created_at: "2026-08-21T11:15:00Z",
      updated_at: "2026-08-24T09:00:00Z"
    },
    {
      id: "prm_tdd_generator",
      title: "TDD Unit & Integration Test Suite Generator",
      category: "prompts",
      description: "Creates comprehensive test cases covering happy paths, edge cases, boundaries, and failure scenarios.",
      tags: ["testing", "tdd", "jest", "node", "unit-test"],
      model: "gpt-4o / gemini-2.5-pro",
      temperature: 0.2,
      max_tokens: 2500,
      version: "1.2.0",
      variables: [
        { name: "MODULE_NAME", defaultValue: "PromptVariableInterpolator", description: "Target module or function" },
        { name: "FRAMEWORK", defaultValue: "Node.js Native Test Runner", description: "Testing framework" }
      ],
      template: `Generate a bulletproof, 100% branch coverage test suite for {{MODULE_NAME}} using {{FRAMEWORK}}.

Include:
- Happy path executions
- Null, undefined, empty string & malformed payload handling
- Unicode, emoji, and special regex boundary characters
- Performance execution under high concurrency loads
- Clear descriptive assertion messages`,
      created_at: "2026-08-22T08:45:00Z",
      updated_at: "2026-08-22T08:45:00Z"
    }
  ],

  skills: [
    {
      id: "skl_antigravity_guide",
      name: "antigravity-guide",
      title: "Antigravity Guide & Customization Engine",
      category: "skills",
      description: "Provides guide, quick reference, and sitemap for Google Antigravity, including CLI, IDE, Python SDK, slash commands, and skills authoring.",
      tags: ["antigravity", "skills", "agent-framework", "customization"],
      version: "2.0.0",
      author: "DeepMind Agentic Team",
      entry_file: "SKILL.md",
      tools_required: ["view_file", "run_command", "replace_file_content"],
      frontmatter: {
        name: "antigravity-guide",
        description: "Provides guide, quick reference, and sitemap for Google Antigravity. Activate when user asks about AGY, skills, MCP, or customizations."
      },
      content: `---
name: antigravity-guide
description: Provides guide, quick reference, and sitemap for Google Antigravity (AGY), including the Antigravity CLI (agy), Antigravity 2.0, Antigravity IDE, Python SDK, slash commands, keybindings, and customizations (skills, rules, MCP, sidecars).
---

# Antigravity Guide & Customization Engine

This skill guides you through the full capabilities of Antigravity:
1. **Discovery**: Discover rules, skills, plugins in \`.agents\` and \`~/.gemini/config\`.
2. **Execution**: Safe subagent orchestration, tool sandboxing, reactive messaging.
3. **Artifacts**: Structured reports in \`<appDataDir>/brain/<conversation-id>/\`.
`,
      created_at: "2026-08-19T14:00:00Z",
      updated_at: "2026-08-25T16:00:00Z"
    },
    {
      id: "skl_docker_orchestrator",
      name: "docker-orchestrator",
      title: "Docker Multi-stage Orchestrator & Optimizer",
      category: "skills",
      description: "Generates and validates production-ready, minimal Alpine/Debian Dockerfiles, compose multi-service configurations, and healthchecks.",
      tags: ["docker", "devops", "containerization", "alpine"],
      version: "1.3.1",
      author: "PromptOps DevOps",
      entry_file: "SKILL.md",
      tools_required: ["run_command", "write_to_file"],
      frontmatter: {
        name: "docker-orchestrator",
        description: "Assists with building ultra-lightweight Docker images, non-root user setup, security scanning, and compose orchestration."
      },
      content: `---
name: docker-orchestrator
description: Generates optimized Dockerfiles and Docker Compose files with layer caching, multi-stage builds, non-root users, and healthchecks.
---

# Docker Multi-stage Orchestrator

## Best Practices:
1. Always use multi-stage builds for compiled / node assets.
2. Run containers with non-root user: \`USER node\` or \`USER appuser\`.
3. Use \`.dockerignore\` to exclude \`node_modules\`, \`.git\`, and test artifacts.
4. Define declarative healthchecks on \`/health\` endpoint.
`,
      created_at: "2026-08-20T09:30:00Z",
      updated_at: "2026-08-23T11:20:00Z"
    },
    {
      id: "skl_bigquery_ml",
      name: "bigquery-ai-ml",
      title: "BigQuery AI/ML Analytics & Time-Series Engine",
      category: "skills",
      description: "Generates SQL queries for BigQuery built-in ML, time-series forecasting (ARIMA_PLUS), anomaly detection, and vector search embeddings.",
      tags: ["bigquery", "sql", "machine-learning", "forecasting"],
      version: "1.1.0",
      author: "DataOps Specialist",
      entry_file: "SKILL.md",
      tools_required: ["view_file", "run_command"],
      frontmatter: {
        name: "bigquery-ai-ml",
        description: "Specialized knowledge for writing BigQuery ML queries, training in-database models, and vector search."
      },
      content: `---
name: bigquery-ai-ml
description: Leverages BigQuery's built-in machine learning and GenAI capabilities for advanced data analytics and predictive modeling.
---

# BigQuery AI/ML Guidelines

- Use \`CREATE OR REPLACE MODEL ... OPTIONS(model_type='ARIMA_PLUS')\` for forecasting.
- Vector search with \`VECTOR_SEARCH(TABLE my_embeddings, 'ml_generate_embedding_result', ...)\`.
`,
      created_at: "2026-08-18T15:00:00Z",
      updated_at: "2026-08-22T10:00:00Z"
    }
  ],

  workflows: [
    {
      id: "wf_feature_quality_gate",
      title: "Autonomous Feature Delivery & Quality Gate DAG",
      category: "workflows",
      description: "End-to-end pipeline: Specification Draft -> Code Generation -> TDD Suite -> Security Audit -> Artifact Packaging.",
      tags: ["ci-cd", "quality-gate", "tdd", "autonomous-pipeline"],
      version: "2.0.0",
      status: "ACTIVE",
      nodes: [
        { id: "node_1", type: "prompt", label: "Spec Generation", refId: "prm_arch_spec", status: "COMPLETED", icon: "file-text", x: 100, y: 150 },
        { id: "node_2", type: "code", label: "Implementation Agent", refId: "skl_antigravity_guide", status: "COMPLETED", icon: "code", x: 340, y: 150 },
        { id: "node_3", type: "test", label: "TDD Test Suite", refId: "prm_tdd_generator", status: "IN_PROGRESS", icon: "check-circle", x: 580, y: 80 },
        { id: "node_4", type: "security", label: "Security & OWASP Audit", refId: "prm_code_reviewer", status: "PENDING", icon: "shield-alert", x: 580, y: 220 },
        { id: "node_5", type: "mcp", label: "Docker Build & Deploy", refId: "mcp_filesystem", status: "PENDING", icon: "package", x: 820, y: 150 }
      ],
      edges: [
        { from: "node_1", to: "node_2", label: "Spec Confirmed" },
        { from: "node_2", to: "node_3", label: "Code Ready" },
        { from: "node_2", to: "node_4", label: "Code Ready" },
        { from: "node_3", to: "node_5", label: "Tests Passed" },
        { from: "node_4", to: "node_5", label: "Zero Vulns" }
      ],
      created_at: "2026-08-20T12:00:00Z",
      updated_at: "2026-08-25T17:00:00Z"
    },
    {
      id: "wf_prompt_benchmarking",
      title: "Prompt Evaluation & LLM Judge Benchmark DAG",
      category: "workflows",
      description: "Evaluates prompt variants against golden test datasets, calculates BLEU/ROUGE/Semantic accuracy and token costs.",
      tags: ["prompt-eval", "benchmark", "llm-judge", "costs"],
      version: "1.2.0",
      status: "READY",
      nodes: [
        { id: "eval_1", type: "dataset", label: "Golden Dataset (100 cases)", refId: null, status: "READY", icon: "database", x: 100, y: 150 },
        { id: "eval_2", type: "prompt", label: "Variant A (Zero-Shot)", refId: "prm_arch_spec", status: "READY", icon: "terminal", x: 350, y: 80 },
        { id: "eval_3", type: "prompt", label: "Variant B (Few-Shot Chain)", refId: "prm_code_reviewer", status: "READY", icon: "terminal", x: 350, y: 220 },
        { id: "eval_4", type: "judge", label: "LLM Judge Score Matrix", refId: null, status: "READY", icon: "award", x: 600, y: 150 },
        { id: "eval_5", type: "report", label: "Final Leaderboard & Cost Diff", refId: null, status: "READY", icon: "bar-chart-2", x: 850, y: 150 }
      ],
      edges: [
        { from: "eval_1", to: "eval_2", label: "Batch Ingest" },
        { from: "eval_1", to: "eval_3", label: "Batch Ingest" },
        { from: "eval_2", to: "eval_4", label: "Predictions A" },
        { from: "eval_3", to: "eval_4", label: "Predictions B" },
        { from: "eval_4", to: "eval_5", label: "Aggregate Scores" }
      ],
      created_at: "2026-08-22T14:30:00Z",
      updated_at: "2026-08-24T18:10:00Z"
    }
  ],

  mcp_servers: [
    {
      id: "mcp_filesystem",
      name: "filesystem-service",
      title: "Filesystem & Workspace MCP Server",
      category: "mcp_servers",
      description: "Direct local file operations, directory listing, regex grep search, and safe transactional file replacement.",
      tags: ["filesystem", "workspace", "stdio", "core"],
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/mx/artefactory"],
      status: "ONLINE",
      version: "1.0.4",
      tools_count: 5,
      tools: [
        {
          name: "read_file",
          description: "Read complete or sliced contents of a file in the workspace",
          parameters: { path: "string", start_line: "number?", end_line: "number?" }
        },
        {
          name: "write_file",
          description: "Create or overwrite a file with provided content",
          parameters: { path: "string", content: "string" }
        },
        {
          name: "list_directory",
          description: "List subdirectories and files recursively",
          parameters: { path: "string" }
        },
        {
          name: "grep_search",
          description: "Search text pattern across directory using ripgrep semantics",
          parameters: { query: "string", path: "string" }
        }
      ],
      created_at: "2026-08-19T13:00:00Z",
      updated_at: "2026-08-25T11:00:00Z"
    },
    {
      id: "mcp_postgres",
      name: "postgres-analytics",
      title: "PostgreSQL & Vector Store MCP Server",
      category: "mcp_servers",
      description: "Executes read/write SQL queries, manages pgvector embeddings, and exposes schema introspection tools.",
      tags: ["database", "postgres", "sql", "sse", "pgvector"],
      transport: "sse",
      endpoint_url: "http://localhost:5432/mcp-sse",
      status: "ONLINE",
      version: "2.1.0",
      tools_count: 3,
      tools: [
        {
          name: "execute_query",
          description: "Execute SQL query with parameterized values",
          parameters: { sql: "string", params: "array?" }
        },
        {
          name: "describe_tables",
          description: "Inspect schema, column types, and foreign key constraints",
          parameters: { schema: "string" }
        },
        {
          name: "vector_similarity_search",
          description: "Find nearest neighbors using HNSW pgvector index",
          parameters: { embedding: "number[]", top_k: "number" }
        }
      ],
      created_at: "2026-08-21T16:20:00Z",
      updated_at: "2026-08-24T12:00:00Z"
    },
    {
      id: "mcp_brave_search",
      name: "brave-search",
      title: "Brave Search & Live Web Intelligence MCP",
      category: "mcp_servers",
      description: "Real-time web search, document retrieval, and markdown conversion for live external knowledge.",
      tags: ["web-search", "brave", "intelligence", "sse"],
      transport: "sse",
      endpoint_url: "http://localhost:8080/brave-mcp",
      status: "ONLINE",
      version: "1.2.0",
      tools_count: 2,
      tools: [
        {
          name: "web_search",
          description: "Performs web search with privacy-first ranking",
          parameters: { query: "string", count: "number?" }
        },
        {
          name: "fetch_url_markdown",
          description: "Fetches target URL and converts HTML to clean markdown",
          parameters: { url: "string" }
        }
      ],
      created_at: "2026-08-22T10:00:00Z",
      updated_at: "2026-08-23T08:30:00Z"
    }
  ],

  rules: [
    {
      id: "rul_agents_standard",
      title: "AGENTS.md Universal Engineering Protocol",
      category: "rules",
      description: "Core guidelines for AI agents: non-destructive file operations, TDD verification, and strict formatting standards.",
      tags: ["agents-md", "guardrails", "coding-standards", "safety"],
      target_file: "AGENTS.md",
      priority: "CRITICAL",
      version: "2.1.0",
      content: `# AGENTS.md Universal Protocol

1. **Non-Destructive Invariant**: Never execute bulk deletes or irreversible drops without explicit user approval.
2. **Planning Precedence**: Major architectural modifications require an approved \`implementation_plan.md\`.
3. **Verification First**: Always run automated tests and lint checks before reporting completion.
4. **Clean Code & Aesthetics**: Follow modern design principles, dark glassmorphism, responsive UI layouts, and explicit type checking.`,
      created_at: "2026-08-19T12:00:00Z",
      updated_at: "2026-08-25T15:00:00Z"
    },
    {
      id: "rul_frontend_aesthetics",
      title: "Frontend UI/UX & Glassmorphism Design System",
      category: "rules",
      description: "Aesthetic tokens, color palettes, micro-interactions, responsive grids, and font hierarchy specifications.",
      tags: ["design-system", "css", "glassmorphism", "aesthetics"],
      target_file: "GEMINI.md",
      priority: "HIGH",
      version: "1.3.0",
      content: `# Design System Directives

- **Color Palette**: Dark Slate (\`#0f172a\`, \`#090d16\`), Glass blur backdrop filter (\`12px\`), subtle borders (\`rgba(255,255,255,0.08)\`).
- **Category Accents**:
  - Prompts: Electric Violet \`#8b5cf6\`
  - Skills: Emerald Mint \`#10b981\`
  - Workflows: Solar Amber \`#f59e0b\`
  - MCP: Cyber Cyan \`#06b6d4\`
  - Rules: Neon Rose \`#f43f5e\`
- **Typography**: Inter / Outfit for display, JetBrains Mono for code blocks.
- **Interactivity**: Smooth hover transformations, active glow states, fast toast notifications.`,
      created_at: "2026-08-20T14:00:00Z",
      updated_at: "2026-08-24T17:00:00Z"
    }
  ],

  logs: [
    {
      id: "log_init_01",
      timestamp: "2026-08-26T12:00:00Z",
      action: "INITIALIZE",
      category: "system",
      itemId: "artefactory_core",
      itemTitle: "Prompt Ops Control Tower Database Initialized",
      details: { environment: "Docker", version: "2.0.0-prod" }
    }
  ]
};
