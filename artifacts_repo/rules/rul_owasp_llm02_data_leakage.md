# OWASP LLM02: Sensitive Information & Credential Scrubbing

# OWASP LLM02 Sensitive Information Disclosure Safeguards

1. **Zero Hardcoded Secrets**: Passwords and tokens must never appear in prompts, artifacts, or commit messages.
2. **Output Sanitization**: Run regex scrubbers for JWT, SSH keys, and cloud credentials before output delivery.