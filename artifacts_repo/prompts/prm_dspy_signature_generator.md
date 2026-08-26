---
id: "prm_dspy_signature_generator"
title: "DSPy Compiled Signature & Module Optimizer"
version: "1.3.0"
model: "claude-3-7-sonnet / gpt-4o"
temperature: 0.1
max_tokens: 3500
category: "prompts"
source_ref: "src_dspy_framework"
source_title: ""
auto_synced: false
tags:
  - "dspy"
  - "optimization"
  - "python"
  - "teleprompter"
  - "signatures"
variables:
  - name: "TASK_GOAL"
    defaultValue: "Extract structured financial metrics from earnings call transcript"
    description: "Target transformation task"
  - name: "INPUT_FIELDS"
    defaultValue: "transcript: str, company_ticker: str"
    description: "Input arguments"
  - name: "OUTPUT_FIELDS"
    defaultValue: "revenue: float, net_income: float, guidance_sentiment: Literal['bullish', 'neutral', 'bearish']"
    description: "Typed outputs"
---

You are a Lead AI Compiler Engineer specializing in Stanford DSPy.
Design a compiled DSPy Module with custom teleprompter metric for the following task:

Task Goal: {{TASK_GOAL}}
Inputs: {{INPUT_FIELDS}}
Outputs: {{OUTPUT_FIELDS}}

Provide:
1. `dspy.Signature` class with full docstrings and typing.
2. `dspy.Module` implementation with `dspy.ChainOfThought` or `dspy.ReAct`.
3. Validation metric function (`validate_output(example, pred, trace=None)`).
4. Optimization script using `dspy.BootstrapFewShotWithRandomSearch` or `dspy.MIPROv2`.
