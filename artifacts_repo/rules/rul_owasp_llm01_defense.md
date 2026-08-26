# OWASP LLM01: Prompt Injection & Context Isolation Protocol

# OWASP LLM01 Prompt Injection Mitigation Policy

1. **Explicit Boundary Encapsulation**: Untrusted input must be wrapped in parameterized XML blocks (`<user_untrusted_input>`).
2. **Instruction Separation**: System directives are parsed with immutable priority.
3. **No Unfiltered Tool Reflection**: Agent thoughts and tool calls must validate against strict JSON Schemas before execution.