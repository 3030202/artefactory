---
id: "prm_cot_step_by_step_reasoning"
title: "Multi-Step Chain-of-Thought (CoT) Trajectory Engine"
version: "2.1.0"
model: "claude-3-7-sonnet / gemini-2.5-pro"
temperature: 0.1
max_tokens: 3500
category: "prompts"
source_ref: "src_anthropic_prompt_eng"
source_title: "Anthropic Claude Prompt Engineering & Meta-Prompting Guide"
auto_synced: true
tags:
  - "chain-of-thought"
  - "cot"
  - "reasoning"
  - "deduction"
variables:
  - name: "COMPLEX_PROBLEM"
    defaultValue: "Calculate optimal database sharding key for high-write telemetry cluster"
    description: "Problem statement"
---

<thinking_scratchpad>
Break down the problem into logical sub-hypotheses:
1. Deconstruct requirements for: {{COMPLEX_PROBLEM}}
2. Identify edge cases, bottleneck constraints, and asymptotic trade-offs.
3. Validate each intermediate conclusion against invariants.
</thinking_scratchpad>

<synthesized_decision>
Provide the final definitive decision, trade-off matrix, and implementation blueprint.
</synthesized_decision>
