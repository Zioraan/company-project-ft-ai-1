# Rule: Core Governance Baseline

- Rule ID: GOV-001
- Scope Type: always-active
- Applies To: entire repository
- Enforcement: blocking

## Rule

Coding work must follow root `AGENTS.md` as baseline policy. Scoped rules may tighten constraints but cannot weaken baseline controls.

## Required Controls

1. Mandatory startup read sequence must be followed.
2. Mandatory pre-commit workflow must be completed in order.
3. Protected-zone paths require explicit developer confirmation before edits.
4. Conflicts are resolved by strictest applicable rule.
5. Root `AGENTS.md` defines global defaults for the repository.
6. Scoped `.agents/rules/*` can only tighten controls, never weaken them.
7. Unclear policy conflicts must block execution until clarified by developer direction.

## Acceptance Criteria

- Any change proposal references applicable governance rules.
- Pre-commit evidence includes lint, typecheck, tests, and memory update check.
- No edits occur in protected zones without explicit confirmation.
- Any policy conflict includes a documented strictest-rule resolution.
