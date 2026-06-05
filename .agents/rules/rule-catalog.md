# Canonical Rule Catalog

This file is the canonical list of the 12 agreed engineering and governance rules.

Purpose:

1. Keep a single numbered rule set for onboarding and audits.
2. Link each rule to its enforcement source.
3. Prevent drift across distributed governance files.

## Rule Sources and Precedence

1. Root baseline policy: `AGENTS.md`
2. Scoped enforcement rules: `.agents/rules/*`
3. Conflict handling: strictest applicable rule wins

## The 12 Canonical Rules

### R-01 No Raw API Enums in UI

Rule:

User-visible UI must not render raw backend enum values.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/frontend-data-boundaries.md` (FE-001)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-02 Service-Boundary-Only Remote Access

Rule:

UI/presentation layers must not perform direct fetch calls; network access goes through service boundaries and shared API client utilities.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/frontend-data-boundaries.md` (FE-001)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-03 URL-Synced Query State

Rule:

List-view query/filter/pagination state must be synchronized with URL params.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-04 Async State Visibility

Rule:

Every async operation must expose observable loading, failure, and success behavior.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/frontend-data-boundaries.md` (FE-001)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-05 Form Resync on Async Source Changes

Rule:

Forms initialized from async-loaded data must resync when source data changes.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-06 Actionable Validation Feedback

Rule:

API validation errors must be shown as actionable feedback, not generic failure text.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-07 Centralized Shared Contracts

Rule:

Shared contracts/types must be centralized to avoid per-surface drift.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-08 Tests for Hooks/Mappers/Query Parsers

Rule:

Hook logic, mappers, and query parser behavior must include tests before merge.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/engineering-quality.md` (ENG-001)

### R-09 Governance Hierarchy (Root Baseline + Scoped Tightening)

Rule:

Root governance defines global defaults; scoped rules can only tighten controls, never weaken them. Strictest rule applies.

Primary references:

- `AGENTS.md` (Rule Hierarchy and Conflict Resolution)
- `.agents/rules/core-governance.md` (GOV-001)

### R-10 Protected Zones Require Explicit Confirmation

Rule:

Protected governance/context paths require explicit developer confirmation before modification.

Primary references:

- `AGENTS.md` (Protected Zones)
- `.agents/rules/core-governance.md` (GOV-001)

### R-11 Pre-Commit Quality and Memory Gate

Rule:

Pre-commit workflow must include lint, typecheck, tests, rule compliance, and memory updates when architecture/workflow changes.

Primary references:

- `AGENTS.md` (Mandatory Pre-Commit Workflow and Core Engineering Constraints)
- `.agents/rules/core-governance.md` (GOV-001)
- `.agents/rules/memory-bank-updates.md` (MEM-001)

### R-12 Staged Migration with Parity Checkpoints

Rule:

Architecture migrations must proceed via staged cutover and explicit parity checkpoints.

Primary references:

- `AGENTS.md` (Core Engineering Constraints)
- `.agents/rules/engineering-quality.md` (ENG-001)
- `docs/migration-checkpoints.md`

## Maintenance

Update this catalog whenever rule semantics or enforcement references change.
