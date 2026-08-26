---
id: "prm_dspy_mipro_optimizer"
title: "DSPy MIPROv2 Multi-Prompt Optimizer Signature"
version: "2.2.0"
model: "claude-3-7-sonnet"
temperature: 0.1
max_tokens: 2048
category: "prompts"
source_ref: "src_dspy_framework"
source_title: "DSPy: Programming—not Prompting—Foundation Models"
auto_synced: true
tags:
  - "dspy"
  - "mipro"
  - "teleprompter"
  - "bayesian-opt"
variables:
  - name: "DATASET_SPLIT"
    defaultValue: "train: 100, val: 50"
    description: "Training examples"
  - name: "METRIC_NAME"
    defaultValue: "semantic_accuracy_with_citation"
    description: "Validation objective"
---

class MultiHopReasoning(dspy.Signature):
    """Answer complex multi-step questions with explicit intermediate reasoning steps."""
    context = dspy.InputField(desc="Retrieved canonical documents")
    question = dspy.InputField(desc="User inquiry requiring multi-hop synthesis")
    thought_trajectory = dspy.OutputField(desc="Step-by-step logical deduction")
    synthesized_answer = dspy.OutputField(desc="Final definitive answer with exact references")
