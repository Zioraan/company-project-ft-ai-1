# Stage 2 Cutover Checklist (Backoffice)

This checklist formalizes Stage 2 closure from legacy source `apps/talent-pipeline-tracker` to target `uis/backoffice`.

## Scope

- Legacy source: `apps/talent-pipeline-tracker`
- Target surface: `uis/backoffice`
- Excluded from Stage 2 closure: Stage 3 service extraction (`services/*`) and Stage 1 website final parity.

## Cutover Criteria

1. Route and feature parity validated for list, detail, filters, notes, and stage/status updates.
2. Async UX parity validated for loading and error states.
3. Rule parity validated for data-boundary constraints.
4. Target surface lint/typecheck passes.
5. Legacy source path explicitly marked as deprecated for active development.

## Verification Evidence

1. Feature parity and entry-view drift closure:
   - `uis/backoffice/components/candidates/CandidateListClient.tsx`
   - `uis/backoffice/app/page.tsx`
   - `uis/backoffice/app/layout.tsx`
2. Rule/boundary parity by implementation shape:
   - `uis/backoffice/components/**` (no direct fetch in UI)
   - `uis/backoffice/services/**` and `uis/backoffice/lib/api-client.ts` (service/API boundary)
3. Quality gate commands:
   - `npm --prefix uis/backoffice run lint`
   - `npx --prefix uis/backoffice tsc --noEmit`
   - `npm run typecheck`
   - `npm run test`

## Legacy Deprecation Decision

`apps/talent-pipeline-tracker` remains available as compatibility reference during Stage 3 extraction, but is deprecated for net-new feature work.

## Follow-on Tasks (Post-Stage 2)

1. Stage 3: extract shared service contracts/adapters to root `services/*`.
2. Stage 4: complete full cutover/stabilization and remove deprecated legacy path when replacement is finalized.
