---
id: "prm_dspy_react_tool_agent"
title: "DSPy ReAct Dynamic Multi-Tool Calling Module"
version: "1.4.0"
model: "claude-3-7-sonnet"
temperature: 0.1
max_tokens: 2048
category: "prompts"
source_ref: "src_dspy_framework"
source_title: "DSPy: Programming—not Prompting—Foundation Models"
auto_synced: true
tags:
  - "dspy"
  - "react"
  - "tools"
  - "agent-loop"
variables:
  - name: "AVAILABLE_TOOLS"
    defaultValue: "grep_search, read_file, execute_sql"
    description: "Callable tools"
---

class ReActAgent(dspy.Module):
    def __init__(self, tools=[{{AVAILABLE_TOOLS}}]):
        super().__init__()
        self.react = dspy.ReAct(dspy.Signature("question -> answer"), tools=tools, max_iters=5)

    def forward(self, question):
        return self.react(question=question)
