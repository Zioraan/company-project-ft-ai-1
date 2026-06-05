# Pull Request Summary

## What Changed

Describe the main implementation changes in this PR.

## Why

Explain the reason for these changes and expected impact.

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] Additional area-specific checks were run where relevant

## Governance Checklist

- [ ] Rule compliance reviewed against `.agents/rules/*` and `AGENTS.md`
- [ ] Protected-zone changes were explicitly approved when applicable
- [ ] Traceability evidence updated when criteria changed (`docs/eval-traceability.md`)

## Memory-Bank Discipline (MEM-001)

- [ ] `memory-bank/progress.md` updated when implementation status/stage/next steps changed
- [ ] `memory-bank/techContext.md` updated when architecture/tooling constraints changed
- [ ] `memory-bank/projectbrief.md` updated when business objective/priorities changed
- [ ] If no memory update was required, reason is stated below

Memory update note (required when unchanged):

- _Explain why no memory-bank file needed changes, if applicable._

## Migration / Cutover Notes (if applicable)

- [ ] Stage checkpoint evidence updated (`docs/migration-checkpoints.md`)
- [ ] Legacy/deprecation policy impact reviewed (`apps/*`, `uis/*`, `services/*`)

## Risk and Rollback

- Risk level: Low / Medium / High
- Rollback approach:
