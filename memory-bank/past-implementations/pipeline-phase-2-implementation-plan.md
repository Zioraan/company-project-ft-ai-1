# Pipeline Phase 2 — Reporting Implementation Plan

Working copy for Phase 2 (reporting KPIs + `services/reporting/`). Depends on Phase 1A. Downstream: Phase 3 (Prefect operationalization).

## Status

- [ ] Implement weekly office/programme KPI aggregation module (new domain file)
- [ ] Add SQLModel persistence for `weekly_office_program_performance`
- [ ] Create `services/reporting/` boundary (schemas, store helpers, router)
- [ ] Wire router into `services/api/app/main.py` with JWT
- [ ] Materialize weekly rows via transform/load functions (callable later by Prefect)
- [ ] Expose `GET /reporting/weekly-office-program-performance`
- [ ] Tests for four KPIs, grain, currency separation, auth
- [ ] Confirm `telemetry_analysis.py` and `GET /telemetry/report` untouched
- [ ] Update progress / project-structure / eval evidence
- [ ] Archive this plan when Phase 2 eval passes

**Phase gate:** Do not start Phase 3 Prefect work until Phase 2 eval acceptance criteria below all pass.

## Goal

Compute the four Weekly Office & Programme Performance KPIs from mandatory Phase 1A telemetry events, load durable reporting rows, and expose them through a new `services/reporting/` boundary — without modifying the existing request-time telemetry report.

## Sources

- `memory-bank/documentation/data-pipeline-CONTEXT.md`
- `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md` § Phase 2
- `docs/telemetry/event-schemas.json` (post–Phase 1A contract)
- Existing anchors (reuse, do not replace): `telemetry_events`, ingest router/store

## Locked decisions

| Decision | Choice |
| --- | --- |
| Source | Read-only `telemetry_events` filtered to mandatory business-metric events |
| KPI map | `inbound_order_created` → `total_material_cost`; `outbound_order_created` → `kits_delivered_count`; `stock_threshold_triggered` → `shortage_events_count`; `kit_cost_variance_detected` → `cost_variance_events_count` |
| Grain | One row per `(office, programme_id, week_start)` where `week_start` is Monday UTC of the ISO week |
| Sink table | `weekly_office_program_performance` (Postgres schema `reporting` when available; SQLite flat table name for tests) |
| Unique key | `(office, programme_id, week_start)` |
| Currency | Per-row `EUR` or `USD`; never mix in one aggregate row |
| Module boundary | New aggregation logic — **not** in `services/api/domain/telemetry_analysis.py` |
| Package | `services/reporting/` imported/wired by FastAPI `main.py` |
| Auth | JWT (`get_current_user`) on reporting routes |
| Materialization | GET reads from reporting table; compute+upsert via shared pure functions that Phase 3 Prefect will call |
| Deferred to Phase 3 | Prefect, `PIPELINE_DESIGN.md`, `pipeline.py`, `telemetry_pipeline_runs`, `GET/POST /reporting/pipeline-runs` |

## KPI formulas

For a bounded week window `[week_start, week_start+7d)` UTC:

| Field | Rule |
| --- | --- |
| `total_material_cost` | Sum of inbound cost (`unit_cost * quantity` or `total_cost`) on `inbound_order_created` events matching office+programme |
| `kits_delivered_count` | Count of `outbound_order_created` |
| `shortage_events_count` | Count of `stock_threshold_triggered` |
| `cost_variance_events_count` | Count of `kit_cost_variance_detected` |
| `currency` | From event `currency` / office default; single currency per row |

Events missing required dimension tags for a KPI are excluded from that KPI aggregate (document behavior in tests).

## Steps

### 1. Domain aggregation module

- [ ] Create new module, preferred path: `services/api/domain/weekly_office_program_performance.py`
  - Pure functions: load events for window → group → compute rows → return list of dict/dataclass rows
  - Do **not** edit `telemetry_analysis.py`
- [ ] Unit tests for aggregation edge cases: empty window, mixed offices, missing programme_id excluded, EUR/USD side-by-side

### 2. Persistence model

- [ ] Add `services/api/app/models/reporting.py` (or equivalent) with columns:
  - `id`, `office`, `programme_id`, `week_start`, `total_material_cost`, `kits_delivered_count`, `shortage_events_count`, `cost_variance_events_count`, `currency`, `computed_at`
- [ ] Unique constraint on `(office, programme_id, week_start)`
- [ ] Register model in `services/api/app/core/database.py` `_register_sql_models()` / `create_all`
- [ ] Store helpers for upsert/read by `week_start` (e.g. `services/api/app/store/reporting_store.py` and/or `services/reporting/` store façade)

### 3. `services/reporting/` package

Create package structure:

```
services/reporting/
├── __init__.py
├── router.py          # FastAPI routes (or re-export API router)
├── schemas.py         # response DTOs matching contract
└── service.py         # compute+upsert+read orchestration calling domain + store
```

- [ ] Wire into `services/api/app/main.py` via `include_router`
- [ ] Ensure Docker/Python path can import `services.reporting` (same patterns as other root packages if needed; if import friction, document mounting/`PYTHONPATH` — keep logic in reporting package even if thin router lives under `app/routers/reporting.py` that delegates)

**Preferred integration:** `services/reporting/router.py` included from `main.py`; domain math stays in `services/api/domain/weekly_office_program_performance.py` so pipeline code can import one place in Phase 3.

### 4. Endpoint: weekly performance

- [ ] `GET /reporting/weekly-office-program-performance`
  - Query: optional `week_start` (ISO date); default = most recent computed week in table
  - Auth: JWT required (401 without token)
  - Response shape:

```json
{
  "week_start": "2026-07-13",
  "entries": [
    {
      "office": "valencia",
      "programme_id": "b2b-sales",
      "total_material_cost": 1240.5,
      "kits_delivered_count": 18,
      "shortage_events_count": 1,
      "cost_variance_events_count": 0,
      "currency": "EUR"
    }
  ]
}
```

- [ ] Provide an authenticated internal/service path to **compute and upsert** a week (e.g. `POST /reporting/weekly-office-program-performance/compute` **or** a service function invoked from tests and later from Prefect). Prefer a JWT-protected compute endpoint for Phase 2 testability if CLI/pipeline does not yet exist; Phase 3 will standardize triggers on `POST /reporting/pipeline-runs`.

### 5. Tests

- [ ] `tests/test_weekly_office_program_performance.py` — pure aggregation unit tests
- [ ] `tests/test_reporting_api.py` — auth, response shape, KPI correctness against seeded `telemetry_events`, currency separation, idempotent upsert (second compute same week does not duplicate rows)
- [ ] Leave `tests/test_telemetry_report.py` as regression for old report (untouched behavior)

### 6. Close Phase 2

- [ ] Update `docs/eval-traceability-telemetry.md` (or add `docs/eval-traceability-reporting.md`) with Phase 2 evidence
- [ ] Update `memory-bank/progress.md` and `project-structure.md` (`services/reporting/`, new models, endpoints)
- [ ] Archive this plan to `memory-bank/past-implementations/`
- [ ] Unlock Phase 3

## Eval acceptance criteria (Phase 2)

Phase 2 is complete only if all are true:

- [ ] Backoffice producers emit approved envelopes (from Phase 1A)
- [ ] API accepts batches via `POST /telemetry/events`
- [ ] Events validated; raw rows persist in `telemetry_events`
- [ ] Event names/allowlists documented in `docs/telemetry/event-schemas.json`
- [ ] KPI calculations exist over mandatory material telemetry
- [ ] KPI logic uses persisted telemetry (not mock-only)
- [ ] Reporting output exposed through `services/reporting/`
- [ ] KPI/report behavior covered by tests
- [ ] Traceability / KPI intent documented
- [ ] `telemetry_events` remains read-only source for this milestone
- [ ] `services/api/domain/telemetry_analysis.py` and `GET /telemetry/report` were **not** modified for this reporting pipeline

Planned KPI outputs present:

- [ ] Material Cost per Office/Programme
- [ ] Kits Delivered
- [ ] Shortage Frequency
- [ ] Cost Variance Frequency

Grain and fields:

- [ ] One row per `office`, `programme_id`, `week_start`
- [ ] Fields: `total_material_cost`, `kits_delivered_count`, `shortage_events_count`, `cost_variance_events_count`, `currency`

## Files touched (expected)

| Action | Path |
| --- | --- |
| Create | `services/api/domain/weekly_office_program_performance.py` |
| Create | `services/api/app/models/reporting.py` |
| Create | `services/api/app/schemas/reporting.py` (and/or under `services/reporting/`) |
| Create | `services/api/app/store/reporting_store.py` |
| Create | `services/reporting/` package (`router.py`, `service.py`, …) |
| Edit | `services/api/app/core/database.py`, `services/api/app/main.py` |
| Create | `tests/test_weekly_office_program_performance.py`, `tests/test_reporting_api.py` |
| Update | `memory-bank/progress.md`, `project-structure.md`, eval docs |

## Explicitly deferred to Phase 3

- [ ] `data/pipelines/PIPELINE_DESIGN.md`
- [ ] `data/pipelines/pipeline.py` with Prefect
- [ ] `telemetry_pipeline_runs` table
- [ ] `GET /reporting/pipeline-runs/latest`
- [ ] `POST /reporting/pipeline-runs`
- [ ] Prefect dependency in `requirements.txt`

## Non-goals

- Modifying live `/telemetry/report` KPIs
- FX conversion
- Loading results into `telemetry_events`
- Full Prefect orchestration
- Rebuilding frontend capture from scratch

## Dependencies

- Requires Phase 1A complete (correct event names + properties in `telemetry_events`)
- Unlocks Phase 3 (orchestrates the same transform/load functions)

## Related phase plans

- Phase 1: `memory-bank/documentation/pipeline-phase-1-implementation-plan.md`
- Phase 1A: `memory-bank/documentation/pipeline-phase-1a-implementation-plan.md`
- Phase 3: `memory-bank/documentation/pipeline-phase-3-implementation-plan.md`
