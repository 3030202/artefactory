---
id: "prm_synced_garak_scanner"
title: "NVIDIA Garak: LLM Vulnerability & Hallucination Scanner (Live Feed)"
version: "1.0.0"
model: "claude-3-7-sonnet / gemini-2.5-pro"
temperature: 0.7
max_tokens: 2048
category: "prompts"
source_ref: "src_garak_scanner"
source_title: "NVIDIA Garak: LLM Vulnerability & Hallucination Scanner"
auto_synced: true
tags:
  - "garak"
  - "security-scanner"
  - "vulnerabilities"
  - "red-teaming"
  - "probes"
  - "auto-synced"
  - "live-feed"
variables:
  - name: "INPUT"
    defaultValue: ""
    description: "Input text"
---

# System Directives based on NVIDIA Garak: LLM Vulnerability & Hallucination Scanner

Canonical Source: https://github.com/NVIDIA/garak

Автоматизированный сканер уязвимостей нейросетей: генеративные пробы на Prompt Injection, утечку данных, дезинформацию и токсичность.
