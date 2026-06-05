# Rule: Context Priority and Historical References

- Rule ID: CTX-001
- Scope Type: always-active
- Applies To: entire repository
- Enforcement: blocking

## Rule

`CONTEXT.md` is mandatory and must be treated as always-on business context. Historical milestone context documents stored under `memory-bank/reference/` are reference-only and ignored by default unless explicitly requested or required for traceability.

## Behavior Requirements

1. Session startup must include `CONTEXT.md`.
2. Historical context files must not be treated as active requirements unless explicitly invoked.
3. If historical context is used, the reason must be recorded in delivery notes or progress memory.

## Acceptance Criteria

- Startup checklist includes `CONTEXT.md` as required.
- Work output is aligned to current context by default.
- Historical references, when used, include explicit justification.
