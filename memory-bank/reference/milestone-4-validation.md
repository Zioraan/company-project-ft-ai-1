# Milestone 4 Validation (with M1–M3 regression)

Primary validation source: Milestone 4 monorepo eval criteria. Regression baselines: `memory-bank/reference/*`.

## Section A — Milestone 4 pass criteria

| ID | Criterion | Evidence |
|---|---|---|
| M4-R01 | `memory-bank/`, `AGENTS.md`, `.agents/` | Governance artifacts at repo root |
| M4-R02 | `uis/website` + `uis/backoffice` | [`uis/README.md`](../../uis/README.md) |
| M4-R03 | Separate backoffice layout | `uis/backoffice/app/layout.tsx` vs `uis/website/app/layout.tsx` |
| M4-R04 | `/` entry dashboard + M2 output | `uis/backoffice/app/page.tsx`, `BusinessLogicPanel` |
| M4-R05 | Import not copy | `src/utils/*`, `src/data/talent-sample-data.ts` |
| M4-R06 | Incidents in backoffice | `uis/backoffice/app/incidents/analysis` |

### Route map

| Route | Purpose |
|---|---|
| `/` | Internal entry dashboard |
| `/candidates` | Milestone 3 talent pipeline list |
| `/candidates/[id]` | Candidate detail, notes, updates |
| `/incidents/analysis` | Support ticket CSV analysis |

## Section B — M1 regression

Reference: [`memory-bank/reference/web-fundamentals-context.md`](../reference/web-fundamentals-context.md)

- `uis/website` landing sections unchanged
- `/signup` form validations intact
- `npm run build --prefix uis/website` passes

## Section C — M2 regression

Reference: [`memory-bank/reference/coding-fundamentals-CONTEXT.md`](../reference/coding-fundamentals-CONTEXT.md)

- Canonical sample data: [`src/data/talent-sample-data.ts`](../../src/data/talent-sample-data.ts)
- DB-ready mappers: [`src/data/talent-sample-mappers.ts`](../../src/data/talent-sample-mappers.ts)
- Tests re-export fixture: [`tests/fixtures/nexovaData.ts`](../../tests/fixtures/nexovaData.ts)
- `npm run test` and `npm run typecheck:root` pass

## Section D — M3 regression

Reference: [`memory-bank/reference/talent-pipeline-tracker-CONTEXT.md`](../reference/talent-pipeline-tracker-CONTEXT.md)

- List at `/candidates` with mapped status/stage labels
- URL-synced filters without full reload
- Detail notes and PATCH flows at `/candidates/[id]`
- Async loading/error states preserved
- No direct fetch in components

## Verification commands

```bash
npm run ci
npm run build --prefix uis/backoffice
npm run build --prefix uis/website
pytest
```

## Manual walkthrough

1. Open backoffice `/` — dashboard, quick links, M2 metrics panel
2. Open `/candidates` — tracker list
3. Open a candidate detail — back link returns to `/candidates`
4. Open `/incidents/analysis` — upload flow still works
5. Open website `/` and `/signup` — unchanged public surface
