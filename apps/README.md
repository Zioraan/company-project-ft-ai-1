# apps Directory

Current role in this repository: legacy and compatibility reference during staged migration.

## Current status

1. Active UI surfaces live under `uis/*`.
2. Shared service extraction is moving toward `services/*`.
3. Paths under `apps/*` are retained temporarily for compatibility and traceability.

## Development policy

1. Do not add net-new feature work under `apps/*`.
2. Add new UI work under `uis/website` or `uis/backoffice`.
3. Add shared integration logic under root `services/*`.
4. Keep legacy app docs explicit about deprecation and target replacement paths.

## Stage references

1. `docs/migration-checkpoints.md`
2. `docs/eval-traceability.md`
3. `docs/stage2-cutover-checklist.md`

## Deprecation sunset criteria

`apps/*` legacy paths can be removed only when all conditions are true:

1. Replacement UI behavior in `uis/*` is validated for critical flows.
2. Shared service extraction to `services/*` is complete for active consumers.
3. Regression checks pass for website, backoffice, and root logic layers.
4. Traceability evidence for Stage 4 cutover is marked complete.
5. Team confirms no remaining operational dependency on `apps/*` routes.
