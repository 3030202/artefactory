# OWASP GenAI 2025/2026 Security Guardrails Policy

# OWASP GenAI Top 10 Security Protocol

1. **LLM01: Prompt Injection Defense**:
   - Treat all external input (URLs, web searches, chat inputs) as untrusted.
   - Enclose untrusted user payloads inside structured XML tags with strict delimiter escaping.
2. **LLM06: Excessive Agency Invariant**:
   - High-impact mutating operations (DROP DATABASE, broad DELETE, infrastructure destroys) require mandatory human confirmation.
3. **LLM02: Sensitive Data Protection**:
   - Never output API keys, private credentials, or PII into logs, public artifacts, or commit messages.