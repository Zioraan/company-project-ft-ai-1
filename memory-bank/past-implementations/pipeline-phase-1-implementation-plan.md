# Pipeline Phase 1 — Planning and Design Implementation Plan

Working copy for Phase 1 (planning and design). Downstream phases: 1A (telemetry contract), 2 (reporting), 3 (Prefect operationalization).

## Status

- [ ] Verify brief defines phases 1 / 1A / 2 / 3 as one coordinated project
- [ ] Verify each phase has explicit evaluation criteria
- [ ] Verify architecture, boundaries, and handoff expectations are documented
- [ ] Verify persistence, endpoint, idempotency, auth, and testing expectations are documented
- [ ] Verify non-goals are explicit enough to prevent scope drift
- [ ] Mark Phase 1 complete in `memory-bank/progress.md`
- [ ] Archive this plan to `memory-bank/past-implementations/` when closed

**Phase gate:** Do not start Phase 1A feature work until this checklist passes and Phase 1 is accepted.

## Goal

Treat [`memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md`](PIPELINE_IMPLEMENTATION_BRIEF.md) (also mirrored under `data/pipelines/`) as the definitive planning artifact for the Weekly Office & Programme Performance reporting pipeline. Phase 1 is verification and handoff readiness — not greenfield design.

## Sources

- `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md`
- `memory-bank/documentation/data-pipeline-CONTEXT.md`
- `memory-bank/documentation/telemetry-CONTEXT.md`
- `docs/telemetry/event-schemas.json` (current-state, known gap)
- `docs/telemetry/telemetry-plan.md` (current-state, known gap)

## Locked decisions (project-wide)

These apply to all subsequent phases and must remain consistent:

| Decision | Choice |
| --- | --- |
| Report grain | One row per `(office, programme_id, week_start)` |
| KPI sink table | `reporting.weekly_office_program_performance` |
| Run metadata table | `telemetry_pipeline_runs` |
| Reporting boundary | New `services/reporting/` package; FastAPI wires via `main.py` |
| Auth on `/reporting/*` | JWT via `get_current_user` |
| Telemetry ingest | Remains public; `telemetry_events` immutable append-only source |
| Out of scope surfaces | Do not modify `services/api/domain/telemetry_analysis.py` or `GET /telemetry/report` |
| Idempotency (Phase 3) | Upsert on `(office, programme_id, week_start)` |
| Currency | No FX conversion in v1; Valencia=`EUR`, Miami=`USD` |
| Prefect dependency | Add to `services/api/requirements.txt` in Phase 3 |

## Steps

### 1. Phase framing check

Confirm the brief explicitly defines:

- Phase 1 — planning and design
- Phase 1A — telemetry contract and instrumentation alignment
- Phase 2 — reporting implementation
- Phase 3 — Prefect pipeline operationalization

Confirm each phase has a dedicated eval section with pass/fail criteria.

### 2. Architecture and boundary check

Confirm the brief documents:

- Data flow: producer → `POST /telemetry/events` → `telemetry_events` → extract/transform/load → reporting table + run metadata
- Separation of `services/reporting/` from telemetry analysis
- Non-modification of existing request-time telemetry report
- Prefect ownership under `data/pipelines/` with API importing (not duplicating) pipeline logic

### 3. Persistence and API contract check

Confirm the brief names:

- `reporting.weekly_office_program_performance` columns and unique key
- `telemetry_pipeline_runs` fields
- Endpoints:
  - `GET /reporting/weekly-office-program-performance`
  - `GET /reporting/pipeline-runs/latest`
  - `POST /reporting/pipeline-runs`
- Idempotency strategy (upsert / delete-and-rebuild) and second-run behavior after partial failure

### 4. Gap and handoff check

Confirm the brief surfaces current workspace gaps for implementers:

- Old procurement/assignment event vocabulary still live
- Missing `programme_id`, `currency`, cost fields on inventory
- Missing `data/pipelines/PIPELINE_DESIGN.md` and `pipeline.py`
- Prefect not in requirements
- No reporting or pipeline-run tables yet

### 5. Non-goals check

Confirm non-goals include at least:

- No telemetry envelope redesign
- No FX conversion
- No loading KPIs back into `telemetry_events`
- No full Prefect cloud platform requirement beyond local/API-triggered runs
- No modification of `GET /telemetry/report` / `telemetry_analysis.py` for this milestone

### 6. Close Phase 1

- Mark all checklist items complete in this file
- Update `memory-bank/progress.md` that Phase 1 planning is accepted
- Move this plan to `memory-bank/past-implementations/`
- Proceed only to Phase 1A under `pipeline-phase-1a-implementation-plan.md`

## Eval acceptance criteria (Phase 1)

Phase 1 is complete only if all are true:

- [ ] The brief defines phase 1, phase 1A, phase 2, and phase 3 as one coordinated project
- [ ] Each phase has explicit evaluation criteria
- [ ] The brief defines expected architecture and phase boundaries
- [ ] The brief defines intended telemetry entities, KPI targets, and pipeline scope
- [ ] The brief defines handoff expectations clearly enough for another agent to implement against it
- [ ] The brief defines or recommends concrete persistence, endpoint, idempotency, and testing expectations
- [ ] The brief makes non-goals explicit enough to prevent scope drift

Evidence artifact: `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md` (and `data/pipelines/PIPELINE_IMPLEMENTATION_BRIEF.md` if kept in sync).

## Files touched in this phase

| Action | Path |
| --- | --- |
| Verify (primary) | `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md` |
| Verify | `memory-bank/documentation/data-pipeline-CONTEXT.md` |
| Verify | `memory-bank/documentation/telemetry-CONTEXT.md` |
| Update on close | `memory-bank/progress.md` |
| Archive on close | this plan → `memory-bank/past-implementations/` |

No application code changes in Phase 1.

## Tests

Phase 1 is documentation/process only. Verification is the checklist above (manual review against the brief). No automated tests required for Phase 1 closeout.

## Non-goals

- Implementing telemetry producer renames (Phase 1A)
- Implementing reporting tables or endpoints (Phase 2)
- Implementing Prefect orchestration (Phase 3)
- Rewriting the brief unless a gap fails the checklist (then amend brief before closing Phase 1)

## Dependencies

- None. This phase unlocks Phase 1A.

## Related phase plans

- Phase 1A: `memory-bank/documentation/pipeline-phase-1a-implementation-plan.md`
- Phase 2: `memory-bank/documentation/pipeline-phase-2-implementation-plan.md`
- Phase 3: `memory-bank/documentation/pipeline-phase-3-implementation-plan.md`
