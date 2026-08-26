---
id: "prm_synced_promptlayer_registry"
title: "PromptLayer Prompt Registry Architecture & Semantic Versioning (Live Feed)"
version: "1.0.0"
model: "claude-3-7-sonnet / gemini-2.5-pro"
temperature: 0.7
max_tokens: 2048
category: "prompts"
source_ref: "src_promptlayer_registry"
source_title: "PromptLayer Prompt Registry Architecture & Semantic Versioning"
auto_synced: true
tags:
  - "prompt-registry"
  - "semver"
  - "playground"
  - "observability"
  - "versioning"
  - "auto-synced"
  - "live-feed"
variables:
  - name: "INPUT"
    defaultValue: ""
    description: "Input text"
---

# System Directives based on PromptLayer Prompt Registry Architecture & Semantic Versioning

Canonical Source: https://docs.promptlayer.com/features/prompt-registry/overview

Архитектурный паттерн реестра промптов: разделение версий на dev/staging/prod, связывание входных переменных, замер стоимости токенов и аудит-трейсинг.
