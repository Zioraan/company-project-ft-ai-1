# AGENTS Governance Contract

This file defines coding-agent operating policy for this repository.

## 1) Scope Separation

- `agents/` is for runtime company workflow agents (product features and automation agents).
- `.agents/` is for coding-agent rules and skills used during software development.
- This file (`AGENTS.md`) sets the global coding-governance baseline.
- Local scope rules may be stricter than this baseline, but they cannot weaken it.

## 2) Mandatory Session Startup Reads

Every coding session must read these sources in order:

1. `CONTEXT.md` (always-on business context, required).
2. `memory-bank/projectbrief.md`.
3. `memory-bank/techContext.md`.
4. `memory-bank/progress.md`.

Optional-by-default references:

- `memory-bank/reference/*` files are historical contexts and should be ignored unless explicitly requested or required for traceability.

## 3) Mandatory Pre-Commit Workflow

No commit should be made unless all steps below are complete in order:

1. Context check: verify task scope aligns with `CONTEXT.md` and memory-bank current state.
2. Quality checks: run lint, typecheck, and relevant tests for changed areas.
3. Rule compliance check: confirm no violations of `.agents/rules/*` and protected-zone policy.
4. Memory update check: update `memory-bank/progress.md` when architecture, workflow, or delivery status changed.
5. Evidence check: confirm acceptance criteria for the changed task are explicitly verifiable.

## 4) Protected Zones (Explicit Confirmation Required)

The following paths require explicit developer confirmation before modification:

- `CONTEXT.md`
- `memory-bank/**`
- `.agents/**`
- `services/**` (when created at root)
- `apps/talent-pipeline-tracker/AGENTS.md`

## 5) Core Engineering Constraints

- UI must not render raw API enum values directly.
- API access must go through a service boundary (no direct fetch in UI components).
- Async operations must expose loading, success, and error states.
- Architecture migrations must use staged cutover with parity checkpoints.
- Query/filter/pagination state in UI lists must be URL-synced for traceability.
- Form state sourced from async-loaded data must resync when source data changes.
- API validation errors must be surfaced as actionable feedback, not generic failure text.
- Shared contracts must be centralized (avoid duplicated per-surface type drift).
- Hooks, mappers, and query parsers require tests before merge.
- Pre-commit gate requires lint, typecheck, tests, and memory update verification when architecture/workflow changes.

## 6) Rule Hierarchy (Policy Precedence)

- Root `AGENTS.md` defines global defaults and mandatory controls.
- `.agents/rules/*` can add stricter constraints by scope.
- Scoped rules must never weaken root controls.
- If root and scoped policies differ, the strictest applicable policy wins.
- If conflict cannot be resolved unambiguously, stop and request developer direction.
- Canonical numbered rule set is maintained in `.agents/rules/rule-catalog.md`.

## 7) Conflict Resolution

- Baseline policy lives here.
- Scoped policy may tighten requirements only.
- When policies conflict, the strictest applicable rule wins.
- If unresolved, stop and request developer direction before continuing.
