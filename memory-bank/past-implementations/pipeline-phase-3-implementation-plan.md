# Pipeline Phase 3 — Prefect Pipeline Operationalization Implementation Plan

Working copy for Phase 3 (Prefect orchestration, run metadata, manual trigger/status). Depends on Phase 2.

## Status

- [ ] Write `data/pipelines/PIPELINE_DESIGN.md`
- [ ] Add Prefect to `services/api/requirements.txt` (+ import path for `data/pipelines`)
- [ ] Implement `data/pipelines/pipeline.py` (`@flow`, ≥3 `@task`, retries, caching, `return_state=True`, CLI)
- [ ] Add `telemetry_pipeline_runs` persistence
- [ ] Extend reporting API: `GET /reporting/pipeline-runs/latest`, `POST /reporting/pipeline-runs`
- [ ] Ensure endpoints import from `data/pipelines/pipeline.py` (no duplicated ETL in routers)
- [ ] Tests: CLI, manual trigger, latest run, idempotent rerun, failed-run metadata, Prefect patterns
- [ ] Update progress / project-structure / eval evidence
- [ ] Archive this plan (and close the overall pipeline project) when Phase 3 eval passes

**Phase gate:** Overall pipeline milestone complete only when Phase 3 eval acceptance criteria below all pass.

## Goal

Operationalize the Weekly Office & Programme Performance ETL with Prefect: extract from `telemetry_events`, transform into KPI rows, upsert into `reporting.weekly_office_program_performance`, record durable run metadata, and expose manual trigger + latest-run status via reporting endpoints.

## Sources

- `memory-bank/documentation/data-pipeline-CONTEXT.md`
- `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md` § Phase 3
- Phase 2 deliverables: domain aggregation module, reporting table, `services/reporting/`
- `data/pipelines/README.md`

## Locked decisions

| Decision | Choice |
| --- | --- |
| Flow name | `weekly_office_program_performance_flow` |
| Tasks (minimum) | `extract_telemetry_events_task`, `transform_telemetry_kpis_task`, `load_weekly_office_program_performance_task` |
| Supporting tasks | `record_pipeline_run_start_task`, `record_pipeline_run_finish_task`, `notify_pipeline_failure_task` (optional notify uses `return_state=True`) |
| Retries | Configure retries on extract (or DB/session external-service) task |
| Caching | Prefetch cache on transform task |
| Idempotency | Upsert by `(office, programme_id, week_start)`; `telemetry_events` never mutated |
| Run metadata table | `telemetry_pipeline_runs` |
| Prefect install | `services/api/requirements.txt` |
| API import rule | Routers call into `data/pipelines/pipeline.py`; do not reimplement ETL |
| Auth | JWT on pipeline trigger/status endpoints |
| Trigger semantics | Sync kickoff returning run metadata with `status: running` or completed short runs; `409` if same window already running; `422` invalid windows |

## Recommended task graph

```mermaid
flowchart LR
  startTask[record_pipeline_run_start_task]
  extractTask[extract_telemetry_events_task]
  transformTask[transform_telemetry_kpis_task]
  loadTask[load_weekly_office_program_performance_task]
  finishTask[record_pipeline_run_finish_task]
  notifyTask[notify_pipeline_failure_task]
  startTask --> extractTask --> transformTask --> loadTask --> finishTask
  finishTask -.-> notifyTask
```

## Run metadata fields

Persist at least:

| Field | Type | Purpose |
| --- | --- | --- |
| `run_id` | UUID/string | Unique run id |
| `flow_name` | string | Flow identity |
| `trigger_mode` | string | `manual` \| `scheduled` |
| `status` | string | `running` \| `completed` \| `failed` |
| `source_window_start` | datetime | Extract window start |
| `source_window_end` | datetime | Extract window end |
| `started_at` | datetime | Run start |
| `ended_at` | datetime | Run end |
| `records_extracted` | int | Raw rows read |
| `records_loaded` | int | KPI rows written |
| `error_count` | int | Error tally |
| `error_summary` | string/null | Concise failure text |
| `created_at` | datetime | Row insert time |

Constraints: unique `run_id`; indexes on `started_at`, `status`, `(flow_name, started_at)`.

## Steps

### 1. Design document

- [ ] Create `data/pipelines/PIPELINE_DESIGN.md` covering:
  - Business purpose (Laura/Elena weekly report)
  - Source (`telemetry_events`) and sink (`weekly_office_program_performance`)
  - Event → KPI mapping
  - Grain and currency rules
  - Prefect flow/task layout
  - Idempotent upsert strategy and rerun-after-failure behavior
  - Run metadata table
  - How to run CLI and API trigger locally
  - Non-goals (no FX, no write-back to telemetry)

### 2. Dependency and import path

- [ ] Add `prefect` to `services/api/requirements.txt`
- [ ] Ensure API process can import `data.pipelines.pipeline` (Docker `PYTHONPATH`, compose volume for `./data`, or packagepath bootstrap in `pipeline.py` / `main.py`)
- [ ] Document the chosen local run command in `PIPELINE_DESIGN.md`

### 3. Implement `data/pipelines/pipeline.py`

- [ ] `@flow` `weekly_office_program_performance_flow(source_window_start, source_window_end, trigger_mode, run_id=...)`
- [ ] `@task` extract with retries — read `telemetry_events` for window
- [ ] `@task` transform with cache — call Phase 2 domain aggregation
- [ ] `@task` load — upsert into reporting table
- [ ] Run start/finish metadata tasks
- [ ] Optional failure notify task invoked with `return_state=True`
- [ ] CLI entrypoint: `python -m` or `python data/pipelines/pipeline.py --start ... --end ...`
- [ ] Reuse Phase 2 pure functions; do not duplicate KPI math

### 4. Persistence: `telemetry_pipeline_runs`

- [ ] SQLModel model + register in `database.py`
- [ ] Store helpers: create running row, finalize completed/failed, fetch latest, detect in-progress same window
- [ ] Include in `create_all` / test DB reset path

### 5. Reporting API extensions

Extend `services/reporting/` (JWT-protected):

#### `GET /reporting/pipeline-runs/latest`

- [ ] Returns latest run metadata envelope `{ "data": { ... } }`
- [ ] `404` with clear message when no runs exist

#### `POST /reporting/pipeline-runs`

Request body:

```json
{
  "trigger_mode": "manual",
  "source_window_start": "2026-07-01T00:00:00Z",
  "source_window_end": "2026-07-02T00:00:00Z"
}
```

- [ ] Validates window (`422` if invalid / start ≥ end)
- [ ] `409` if equivalent run already `running` for same window
- [ ] Imports and invokes functions from `data/pipelines/pipeline.py`
- [ ] Returns created run metadata (`status: running` or terminal if sync-short)

Keep Phase 2 `GET /reporting/weekly-office-program-performance` intact.

### 6. Tests

Minimum matrix:

- [ ] `data/pipelines/pipeline.py` runs as CLI without import/runtime errors
- [ ] Manual trigger creates run + returns metadata
- [ ] Latest-run endpoint returns most recent persisted run
- [ ] Rerunning same source window does **not** duplicate reporting rows (upsert)
- [ ] Failed/partial runs persist execution metadata with status + error details
- [ ] Extract (or designated) task has retry configuration present
- [ ] Optional task executed with `return_state=True`
- [ ] Transform task has cache configuration present
- [ ] New files: e.g. `tests/test_pipeline.py`, `tests/test_reporting_pipeline_api.py`

### 7. Close Phase 3 / overall milestone

- [ ] Update eval traceability (`docs/eval-traceability-telemetry.md` or reporting-specific matrix)
- [ ] Update `memory-bank/progress.md` and `project-structure.md` (`data/pipelines/pipeline.py`, Prefect, run table, endpoints)
- [ ] Archive this plan to `memory-bank/past-implementations/`
- [ ] Optionally archive Phase 1/1A/2 plans and note overall pipeline milestone complete
- [ ] Consider moving brief copy under `data/pipelines/` notes if desired

## Eval acceptance criteria (Phase 3)

Phase 3 is complete only if all are true:

- [ ] `data/pipelines/PIPELINE_DESIGN.md` exists and describes the real telemetry/reporting pipeline
- [ ] `data/pipelines/pipeline.py` exists and is executable as a CLI entrypoint
- [ ] Prefect `@flow` and `@task` boundaries implement extract, transform, and load
- [ ] At least one external-service task has retries configured
- [ ] At least one optional task is invoked with `return_state=True`
- [ ] At least one transformation task uses Prefect caching
- [ ] Load behavior is explicitly idempotent for re-runs over the same data window
- [ ] Pipeline run metadata is durably recorded
- [ ] Backend endpoints exist for latest run metadata and manual trigger
- [ ] Backend endpoints import pipeline logic from `data/pipelines/` rather than duplicating it
- [ ] Tests verify re-run safety, manual execution, and run metadata behavior

## Files touched (expected)

| Action | Path |
| --- | --- |
| Create | `data/pipelines/PIPELINE_DESIGN.md` |
| Create | `data/pipelines/pipeline.py` |
| Edit | `services/api/requirements.txt` |
| Create/edit | reporting models/store for `telemetry_pipeline_runs` |
| Edit | `services/reporting/router.py` (or equivalent), `main.py`, `database.py` |
| Edit | Docker/compose/`PYTHONPATH` if needed for `data/pipelines` import |
| Create | `tests/test_pipeline.py`, `tests/test_reporting_pipeline_api.py` |
| Update | `memory-bank/progress.md`, `project-structure.md`, eval docs |

## Non-goals

- Full Prefect Cloud / production scheduler platform beyond local and API-triggered runs
- Replacing Phase 2 KPI formulas in routers
- FX conversion
- Writing back to `telemetry_events`
- Changing `GET /telemetry/report`

## Dependencies

- Requires Phase 2 complete (reporting table + domain aggregation + `services/reporting/` GET)
- Completes the overall pipeline project when evals pass

## Related phase plans

- Phase 1: `memory-bank/documentation/pipeline-phase-1-implementation-plan.md`
- Phase 1A: `memory-bank/documentation/pipeline-phase-1a-implementation-plan.md`
- Phase 2: `memory-bank/documentation/pipeline-phase-2-implementation-plan.md`

## Local verification command (to document in design)

Document the exact command after implementation, e.g.:

```bash
python data/pipelines/pipeline.py --start 2026-07-01T00:00:00Z --end 2026-07-08T00:00:00Z
```

Plus authenticated `POST /reporting/pipeline-runs` with a valid JWT.
