# Weekly Office & Programme Performance Pipeline Design

## Purpose

Transform mandatory Nexova material telemetry in `telemetry_events` into durable weekly office/programme KPI rows for Laura (CEO) and Elena (L&D). Cadence is weekly (Monday UTC week starts). Currencies stay office-local (`EUR` / `USD`) with no FX conversion in v1.

## Source

- Table: `telemetry_events` (immutable, append-only)
- Event types:
  - `inbound_order_created` → material cost
  - `outbound_order_created` → kits delivered
  - `stock_threshold_triggered` → shortage frequency
  - `kit_cost_variance_detected` → cost variance frequency
- Required tags: `office`, `programme_id`, `currency` (plus cost on inbound)

## Sink

- Table: `weekly_office_program_performance`
- Grain: `(office, programme_id, week_start)` unique
- Fields: `total_material_cost`, `kits_delivered_count`, `shortage_events_count`, `cost_variance_events_count`, `currency`, `computed_at`

## Run metadata

- Table: `telemetry_pipeline_runs`
- Stores `run_id`, flow name, trigger mode, window, status, counts, errors

## Prefect flow

Flow: `weekly_office_program_performance_flow`

Tasks:

1. `record_pipeline_run_start_task` — persist running metadata
2. `extract_telemetry_events_task` — load source window (retries configured)
3. `transform_telemetry_kpis_task` — aggregate KPIs (Prefect cache configured)
4. `load_weekly_office_program_performance_task` — upsert by natural key
5. `record_pipeline_run_finish_task` — finalize metadata
6. `notify_pipeline_failure_task` — optional; invoked with `return_state=True`

## Idempotency

Upsert on `(office, programme_id, week_start)`. Re-runs for the same window rewrite derived rows without duplicating them and never mutate `telemetry_events`.

## API surface

- `GET /reporting/weekly-office-program-performance`
- `POST /reporting/weekly-office-program-performance/compute` (Phase 2 helper)
- `GET /reporting/pipeline-runs/latest`
- `POST /reporting/pipeline-runs` — imports and runs `data/pipelines/pipeline.py`

All `/reporting/*` routes require JWT.

## Local CLI

From repo root (with `services/api` on `PYTHONPATH`):

```bash
python data/pipelines/pipeline.py --start 2026-07-13T00:00:00Z --end 2026-07-20T00:00:00Z
```

## Non-goals

- No FX conversion
- No writes back to `telemetry_events`
- No changes to `GET /telemetry/report` / `telemetry_analysis.py`
- No full Prefect Cloud deployment requirement beyond local/API-triggered runs
