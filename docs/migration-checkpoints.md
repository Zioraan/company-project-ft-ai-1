# Migration Checkpoints

This document defines staged checkpoints for moving from current app locations to target architecture (`uis/*` and root `services/*`).

## Stage 0 - Governance Ready

Exit criteria:

1. Root governance and memory-bank files exist and are current.
2. `.agents` rules and at least one skill are in place.
3. Traceability matrix exists.

## Stage 1 - Website Surface Scaffold

Source: `apps/marketing-site`
Target: `uis/website`

Exit criteria:

1. Content and section parity.
2. SEO/schema parity.
3. Accessibility and form validation parity.
4. Mobile and desktop behavior parity.

Current progress snapshot:

1. In progress.
2. Landing content and signup form route migrated to `uis/website`.
3. Schema metadata migrated.

## Stage 2 - Backoffice Surface Scaffold

Source: `apps/talent-pipeline-tracker`
Target: `uis/backoffice`

Exit criteria:

1. Candidate list/detail/filter/search parity.
2. Note management and status/stage update parity.
3. Async loading/error state parity.
4. Data-boundary rule compliance parity.

Current progress snapshot:

1. In progress.
2. Source implementation copied from `apps/talent-pipeline-tracker` to `uis/backoffice`.
3. Milestone 2 business-logic module integrated via direct import from root `src` and visible on `/`.
4. Lint and typecheck validations pass in target path.
5. Stage 2 parity audit pass applied for layout/entry-view drift (nested `<main>` removed, dashboard wrapper normalized, metadata aligned).
6. Final cutover checklist documented with explicit deprecation decision for the legacy tracker path.

## Stage 3 - Services Extraction

Source: `apps/talent-pipeline-tracker/services`
Target: `services/*`

Exit criteria:

1. Contract parity with existing endpoints.
2. Consumer parity for both UI surfaces.
3. Typed shared contracts and adapter tests.
4. No direct fetch in UI components.

Current progress snapshot:

1. Started.
2. Shared records service contract extracted to `services/contracts/records.ts`.
3. Shared records domain factory extracted to `services/domain/records.ts`.
4. `uis/backoffice/services/records.ts` switched to root domain factory while preserving existing behavior.
5. Shared notes service contract extracted to `services/contracts/notes.ts`.
6. Shared notes domain factory extracted to `services/domain/notes.ts`.
7. `uis/backoffice/services/notes.ts` switched to root domain factory while preserving existing behavior.

## Stage 4 - Cutover and Stabilization

Exit criteria:

1. New consumers point to target `uis/*` and `services/*` structures.
2. Legacy source paths are marked deprecated.
3. Regression checks pass for critical workflows.
4. Traceability matrix updated with final evidence.
5. Team confirms no remaining operational dependency on legacy `apps/*` routes.

Legacy-sunset completion checklist:

1. `uis/*` replacement routes validated for critical workflows.
2. Required shared adapters are moved to root `services/*`.
3. Lint/typecheck/tests pass across root, website, and backoffice.
4. Stage 4 evidence is recorded in `docs/eval-traceability.md`.
5. Legacy paths are either removed or archived with explicit freeze status.

Current progress snapshot:

1. In progress.
2. Legacy `apps/*` policy and sunset conditions are documented and enforced in docs.
3. Backoffice route performance and data-fetching remediation phases are applied through server prefetch plus SWR-backed client hooks.
4. Root tests and backoffice lint/typecheck checks pass after Phase 4 changes.

Reference:

- `docs/stage2-cutover-checklist.md`
- `docs/warnings-mitigation.md`
