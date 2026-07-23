# Telemetry Eval Traceability Matrix

Maps telemetry Phase 2A (Capture), Phase 2B (Storage), and Phase 2C (Report) criteria to implementation evidence.

## Scope

- Phase 2A Capture: frontend `TelemetryService`; inventory/auth instrumentation
- Phase 2B Storage: `telemetry_events` table, bulk insert, per-event validation
- Phase 2C Report: pandas KPI metrics, `GET /telemetry/report`, 60s cache

## Phase 2A Capture Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-T01 | `POST /telemetry/events` accepts batches (now persists; still HTTP 200) | `services/api/app/routers/telemetry.py`, `services/api/app/schemas/telemetry.py` | `pytest tests/test_telemetry_api.py` | Pass | Unauthenticated; returns `{received,stored,rejected}` |
| E-T02 | `TelemetryEvent` mirrors standard envelope | `services/api/app/schemas/telemetry.py`, `docs/telemetry/event-schemas.json` | Schema review + per-event validate | Pass | Required envelope fields enforced |
| E-T03 | Endpoint URL from `NEXT_PUBLIC_TELEMETRY_ENDPOINT`; `TELEMETRY_ENDPOINT` in backend config | `.env.example` files, `config.py`, `docker-compose.yml` | Config review + settings test | Pass | Defaults to localhost:8000/telemetry/events |
| E-T04 | `TelemetryService` queue, debounce, sendBeacon, retry | `uis/backoffice/services/telemetry.ts` | `tests/telemetry.test.ts` | Pass | Flush at 10s or 20 events; ≤3 retries; visibility flush |
| E-T05 | Auto envelope fields | `uis/backoffice/services/telemetry.ts` | Vitest enrichment assertion | Pass | Callers only pass `event_type` + properties |
| E-T06 | No direct telemetry network calls outside telemetry service | Backoffice inventory/auth components | Grep review | Pass | Components call `track()` only |
| E-T07 | Approved `event_type` values and property allowlists | `docs/telemetry/event-schemas.json` + instrumentation sites | Schema + code review | Pass | Auth/office filter schemas added |
| E-T08 | Failed order attempts tracked | `AssetEntryForm.tsx`, `AssetExitForm.tsx` | Code review + failure-reason tests | Pass | Client validation + API failures |
| E-T09 | Product/stock list viewed on products page load | `AssetListClient.tsx` | Code review | Pass | `asset_list_viewed` once after load |
| E-T10 | No email/name/password in emitted properties | `services/telemetry.ts` sanitize + call sites | Vitest PII strip test | Pass | Blocked property keys dropped |
| E-T11 | Office/category normalization at producers | `uis/backoffice/lib/telemetry-normalize.ts` | Vitest normalize tests | Pass | Valencia/Miami + category map |
| E-T12 | Auth login success/fail and session expired tracked | `LoginForm.tsx`, `platform-api-client.ts` | Code review | Pass | `user_login_*`, `session_expired` |

## Phase 2B Storage Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-T20 | `telemetry_events` table with `timestamp`, `event_type`, `service`, JSONB/`tags` | `services/api/app/models/telemetry.py` | Model review + pytest row asserts | Pass | JSON→JSONB variant for Postgres |
| E-T21 | Indexes on `timestamp`, `event_type`; GIN on `tags` (Postgres) | `models/telemetry.py`, `core/database.py` `ensure_telemetry_indexes` | Code review | Pass | GIN created only on postgresql dialect |
| E-T22 | Real ingest bulk-inserts and returns `{received,stored,rejected}` | `routers/telemetry.py`, `store/telemetry_store.py` | `test_telemetry_mixed_batch_*` | Pass | HTTP 200 on partial reject |
| E-T23 | Invalid events rejected individually without cancelling batch | `routers/telemetry.py` | Mixed-batch pytest | Pass | 5 received → 2 stored / 3 rejected |
| E-T24 | `TelemetryEvent` reused; frontend unchanged | schemas + `uis/backoffice/services/telemetry.ts` | Review | Pass | Still checks `response.ok` only |
| E-T25 | Stored rows populate `event_type`, `timestamp`, `service`, `tags` | `telemetry_store.to_record` | Pytest DB select | Pass | `service=backoffice`; tags from properties |
| E-T26 | One bulk insert per batch (not per event) | `telemetry_store.bulk_insert_events` | `test_telemetry_bulk_insert_is_single_flush` | Pass | Single `add_all` + commit |
| E-T27 | Immutability — no update/delete telemetry APIs | `telemetry_store.py` | File review | Pass | Bulk insert only |

## Phase 2C Report Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-T30 | `domain/telemetry_analysis.py` with ≥2 independent metric functions | `services/api/domain/telemetry_analysis.py` | File review + pytest | Pass | 3 metrics including auth |
| E-T31 | Each metric: SQL load → Pandas refine → convert → group → aggregate | `telemetry_analysis.py` | Code review | Pass | No Python loops for metric calc |
| E-T32 | Timezone-aware timestamps before grouping | `pd.to_datetime(..., utc=True)` | Pytest + code review | Pass | UTC conversion in `_load_events` |
| E-T33 | Metrics return JSON-serializable list[dict] | metric functions | Pytest asserts | Pass | `to_dict(orient="records")` |
| E-T34 | `GET /telemetry/report` optional `start_date`/`end_date` | `routers/telemetry.py` | `test_report_endpoint_*` | Pass | Public route |
| E-T35 | Default window last 7 days when omitted | `_resolve_report_window` | `test_report_endpoint_defaults_*` | Pass | Computed in endpoint |
| E-T36 | Response `{ period, metrics }` | `TelemetryReportResponse` | Pytest | Pass | Includes all three metric keys |
| E-T37 | 60s in-memory cache keyed by period | `_report_cache` | cache hit + TTL expiry tests | Pass | Avoids duplicate `_build_report` |
| E-T38 | Grouping dimensions preserved (not only globals) | assignments + auth metrics | Pytest | Pass | date+office / date |

## Phase 1A Material Contract Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-T1A01 | Mandatory material events in `event-schemas.json` | `docs/telemetry/event-schemas.json` | Schema review | Pass | inbound/outbound/threshold/direct-edit/variance |
| E-T1A02 | Required properties office/product_id/product_category/programme_id/quantity/currency | schemas + producers | Schema + pytest tags | Pass | Inbound also requires `unit_cost` |
| E-T1A03 | `product_category` training_kit/certification/onboarding_equipment | inventory + normalize | Tests | Pass | Asset category allowlist remapped |
| E-T1A04 | Producers emit new event names (not procurement/assignment) | `AssetEntryForm` / `AssetExitForm` | Code review + vitest | Pass | inbound_*/outbound_* |
| E-T1A05 | Ingest still stores into `telemetry_events` | `POST /telemetry/events` | `test_telemetry_api.py` | Pass | Mixed batch with material events |
| E-T1A06 | No personal names in properties | sanitize + exit form | Vitest PII + code review | Pass | Assigned-to is opaque id only in UI; not emitted on success |
| E-T1A07 | `telemetry-plan.md` active KPIs are material report KPIs | `docs/telemetry/telemetry-plan.md` | Doc review | Pass | Weekly Office & Programme Performance |
| E-T1A08 | Threshold / variance / direct-edit instrumented | inventory store/router + forms | `test_inventory_api.py` | Pass | Flags + PATCH stock 403 telemetry |

## Verification Commands

1. `pytest tests/test_telemetry_api.py tests/test_telemetry_report.py tests/test_inventory_api.py`
2. `npm run test:root -- tests/telemetry.test.ts tests/inventory-mappers.test.ts`
3. `npm run typecheck:root`
4. Manual: `GET /telemetry/report` default + custom range; confirm cache reuse within 60s

## Deferred (future)

- Emit `office` on auth login events so `auth_failure_rate` populates from live traffic (tests seed office in tags)
- Support-only events such as `outbound_flow_started` / form abandon signals
