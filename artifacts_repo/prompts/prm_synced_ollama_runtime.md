---
id: "prm_synced_ollama_runtime"
title: "Ollama: Local Large Language Model Runner & API (Live Sync)"
version: "1.0.0"
model: "claude-3-7-sonnet"
temperature: 0.7
max_tokens: 2048
category: "prompts"
source_ref: "src_ollama_runtime"
source_title: ""
auto_synced: true
tags:
  - "ollama"
  - "local-llm"
  - "modelfile"
  - "openai-compatible-api"
  - "offline"
  - "auto-synced"
variables:
  - name: "INPUT"
    defaultValue: ""
    description: "Input text"
---

# Directives based on Ollama: Local Large Language Model Runner & API

Canonical Source: https://docs.ollama.com

Универсальный демон запуска локальных моделей (Llama 3, Qwen 2.5, DeepSeek, Mistral) с поддержкой Modelfile, параметров температуры и OpenAI-совместимого REST API.
