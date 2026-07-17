# Nexova Telemetry Plan

## Scope

This plan defines the telemetry implementation path for Nexova's **training and onboarding material** inventory in the monorepo backoffice and platform API. It is aligned to:

- [memory-bank/documentation/telemetry-CONTEXT.md](/D:/CodingProjects/company-project-ft-ai-1/memory-bank/documentation/telemetry-CONTEXT.md) — mandatory material metrics and entity model (`Product`, `InboundOrder`, `OutboundOrder`, `office`, `programme`)
- [memory-bank/documentation/data-pipeline-CONTEXT.md](/D:/CodingProjects/company-project-ft-ai-1/memory-bank/documentation/data-pipeline-CONTEXT.md) — Weekly Office & Programme Performance Report KPIs and aggregation grain

**Primary business sink:** the Weekly Office & Programme Performance Report (per-office, per-programme, ISO-week rollups of material cost, kits delivered, shortage activity, and cost variance). That report is produced by the business-performance **data pipeline**, not by the legacy assignment KPI surface on `GET /telemetry/report`.

Canonical business entity names for Phase 1A+ are `Product` (material item), `InboundOrder`, and `OutboundOrder`. Older `Asset` / `ProcurementOrder` / `AssignmentOrder` vocabulary may still appear in code or historical notes; it is not the active reporting-pipeline contract.

This document is a handoff-ready phased implementation guide for follow-on agents.

## Business Context

### KPIs (Weekly Office & Programme Performance Report)

These four KPIs are the **active** business metrics. Everything in the business-metric event catalogue exists to compute them correctly, by `office` and `programme_id`, for each ISO week.

| KPI | What it measures | Source event(s) | Where the data is generated |
| --- | --- | --- | --- |
| **Material Cost per Office/Programme** | How much an office spent acquiring training or onboarding material for a programme during the week (local currency; no FX conversion at telemetry or v1 pipeline) | `inbound_order_created` (`unit_cost` and/or `total_cost`, `quantity`, `currency`, `office`, `programme_id`) | Backoffice inbound / entry flow and `POST /inventory/orders/inbound` in the platform API |
| **Kits Delivered** | How many kits or certificates were delivered to clients, candidates, consultants, or agents during the week | `outbound_order_created` | Backoffice outbound / exit flow and `POST /inventory/orders/outbound` |
| **Shortage Frequency** | How many times during the week a programme's material stock ran below the configured minimum | `stock_threshold_triggered` | Platform API after a successful stock-reducing operation when stock ≤ reorder threshold |
| **Cost Variance Frequency** | How many times during the week a material unit cost spiked abnormally vs historical price (e.g. >10%) | `kit_cost_variance_detected` | Platform API when inbound unit cost diverges from the historical value for that material/supplier |

`direct_stock_edit_rejected` is a mandatory business-metric event for control/integrity monitoring and must remain in the catalogue and producers. It is **not** one of the four weekly report KPI aggregations in v1 of the reporting pipeline (which reads only inbound, outbound, threshold, and variance events per data-pipeline context).

### Standard Event Envelope

Every event must include this envelope:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `eventId` | `string` | yes | UUID generated automatically |
| `timestamp` | `string` | yes | ISO 8601 UTC timestamp |
| `sessionId` | `string` | yes | Opaque browser-session identifier |
| `userId` | `string` | yes | Authenticated TinyDB user UUID |
| `event_type` | `string` | yes | `entity_action` format |
| `schemaVersion` | `string` | yes | Event schema version |
| `requestId` | `string` | yes | Correlation id |
| `properties` | `object` | yes | Event-specific allowlisted payload |

### Approved Events

#### Business-metric events (active for the reporting pipeline)

These five `event_type` values are the mandatory Nexova material telemetry contract. They are inputs to (or integrity companions of) the Weekly Office & Programme Performance pipeline.

| Event | Primary entity | Feeds / supports | Delivery | Sensitive data |
| --- | --- | --- | --- | --- |
| `inbound_order_created` | `InboundOrder` | Material Cost per Office/Programme | stream or batch | UUID-only identifiers; cost fields required |
| `outbound_order_created` | `OutboundOrder` | Kits Delivered | stream or batch | UUID-only identifiers; no person names |
| `stock_threshold_triggered` | `Product` | Shortage Frequency | stream | no direct PII |
| `direct_stock_edit_rejected` | `Product` | Stock integrity / bypass monitoring | stream | UUID-only identifiers |
| `kit_cost_variance_detected` | `InboundOrder` / `Product` | Cost Variance Frequency | stream | no direct PII |

#### Support telemetry (NOT inputs to the weekly report)

The following events may remain for operational visibility, UX friction, and auth health. They must **not** be treated as sources for Weekly Office & Programme Performance KPI aggregation.

| Event | Role | Delivery | Notes |
| --- | --- | --- | --- |
| `asset_list_viewed` | Support — inventory navigation | batch | Not a weekly-report KPI input |
| `office_filter_applied` | Support — office segmentation UX | batch | Not a weekly-report KPI input |
| `user_login_succeeded` | Support — access health | batch | Not a weekly-report KPI input |
| `user_login_failed` | Support — access health | batch | Not a weekly-report KPI input |
| `session_expired` | Support — access health | batch | Not a weekly-report KPI input |

Historical assignment-flow friction events (for example `assignment_flow_started`, `assignment_order_failed`, `assignment_form_abandoned`, `procurement_order_failed`) are **superseded** for business metrics. They must not appear as active sources for the weekly report. See the before/after mapping below and `supersededEvents` in `event-schemas.json`.

### Required properties (business-metric inventory events)

Minimum `properties` fields for inventory / material business-metric events (in addition to the standard envelope):

| Property | Required where applicable | Allowed values / notes |
| --- | --- | --- |
| `office` | yes | `valencia` \| `miami` (lowercase in telemetry) |
| `product_id` | yes | Stable product / material identifier |
| `product_category` | yes | `training_kit` \| `certification` \| `onboarding_equipment` |
| `programme_id` | yes | Training or certification programme id (e.g. `b2b-sales`) |
| `quantity` | yes when volume is measured | Positive integer quantity |
| `currency` | yes when money or office-local cost context applies | `EUR` \| `USD` — match office (`valencia`→`EUR`, `miami`→`USD`); do not convert at telemetry layer |

**Inbound cost (Material Cost KPI):** `inbound_order_created` **must** include `unit_cost`. It may also include `total_cost` (typically `unit_cost * quantity`). Without a cost field, Material Cost per Office/Programme cannot be computed.

**PII:** Do not include candidate, client, consultant, or agent names in `properties` — use only programme or kit/product identifiers.

### Before / after telemetry mapping

| Current / Older Telemetry | Phase 1A Required Telemetry | Treatment |
| --- | --- | --- |
| `procurement_order_created` | `inbound_order_created` | Replace for business-metric reporting; inbound material events must include cost context (`unit_cost` required; `total_cost` optional). |
| `assignment_order_created` | `outbound_order_created` | Replace for business-metric reporting; outbound material events drive Kits Delivered. |
| `procurement_order_failed` | _(no pipeline KPI event)_ | Superseded as a business-metric source; optional support-only failure tracking if retained under a non-reporting name. |
| `assignment_order_failed` | _(no pipeline KPI event)_ | Superseded as a business-metric source; not an input to the weekly report. |
| `assignment_flow_started` | _(support / historical)_ | Superseded for weekly report; was part of legacy assignment lead-time KPI. |
| `assignment_form_abandoned` | _(support / historical)_ | Superseded for weekly report. |
| `stock_threshold_triggered` | `stock_threshold_triggered` | Keep event name; update required properties to material contract (`product_id`, `product_category`, `programme_id`, `quantity`, `currency` where applicable). |
| `direct_stock_edit_rejected` | `direct_stock_edit_rejected` | Keep event name; align properties with the material telemetry contract. |
| _(none)_ | `kit_cost_variance_detected` | Add as a new required business-metric event. |
| auth, session, list-view, filter, and other support events | support telemetry only | May remain; clearly excluded from the reporting KPI input set. |

## Architecture Decisions

These decisions remain fixed for Phase 2A Capture / 2B Storage / 2C Report unless explicitly revised. They still apply to envelope shape, batching, ingest, and the **legacy** pandas report path.

1. `POST /telemetry/events` is unauthenticated for now.
The endpoint is still schema-locked and only accepts the standard envelope and approved event/property allowlists. This is the chosen fit for browser-side batching with `navigator.sendBeacon` in the current Docker-based setup.

2. `sessionId` is generated once at successful login and stored in browser `sessionStorage`.

3. `userId` is auto-added by the frontend `TelemetryService`.
Components calling `track()` must not pass `userId`, `sessionId`, `eventId`, `timestamp`, `schemaVersion`, or `requestId` manually.

4. The external event envelope uses `properties`, while storage maps that object into the database JSONB column `tags`.

5. The storage-layer `service` column uses:
- `backoffice` for browser-emitted telemetry
- `platform_api` for API-emitted telemetry

6. Telemetry backend code follows the current FastAPI structure:
- `services/api/app/routers/telemetry.py`
- `services/api/app/schemas/telemetry.py`
- `services/api/app/store/telemetry_store.py` or equivalent
- `services/api/domain/telemetry_analysis.py`

7. Failure telemetry includes both client-side validation failures and API-side rejections when such support events are retained.
These are distinguished with normalized fields such as `failure_stage` and `failure_reason`.

8. `stock_threshold_triggered` requires a persisted reorder / minimum threshold on the product (or asset) model.
No UI-derived approximation is allowed.

9. `pandas` remains an intentional backend dependency for the **legacy** `GET /telemetry/report` / assignment-era analysis surface in Phase 2C.

10. **Report surface separation (important):**
- **Weekly Office & Programme Performance Report** — business sink for the four active KPIs; owned by the reporting / data-pipeline path (`reporting.weekly_office_program_performance`, `GET /reporting/weekly-office-program-performance`, etc.). Business-metric events above are the pipeline inputs.
- **`GET /telemetry/report`** (and `services/api/domain/telemetry_analysis.py`) — separate **support / legacy** report surface for earlier assignment/auth-style KPIs. It is **not** the Weekly Office & Programme Performance pipeline sink. Do not conflate the two when extending Phase 1A or Phase 2 reporting work.

## Cross-Phase Preconditions

The telemetry contract follows Nexova material context exactly. Instrumentation must keep these normalization and model rules in mind:

1. Normalize `office` values to lowercase `valencia` and `miami` in telemetry producers, even if UI/API display labels use `Valencia` / `Miami`.
2. Normalize product categories to canonical telemetry values: `training_kit`, `certification`, `onboarding_equipment` (not the older hardware / furniture style categories).
3. Persist `programme_id` on inventory entities so producers emit real values, not client-only fabrications.
4. Persist `currency` and inbound `unit_cost` (and optionally compute `total_cost`) so Material Cost can be aggregated without inventing costs in analytics.
5. Add a reorder / `min_stock_threshold` (or equivalent) to the persisted product/asset model before implementing `stock_threshold_triggered`.
6. Emit `kit_cost_variance_detected` when inbound unit cost diverges beyond the configured threshold from historical cost for that material.
7. Add a durable path to detect and reject direct stock edits; emit `direct_stock_edit_rejected` when operators attempt to bypass order-based stock mutation.
8. Keep `userId` and any operator identifiers as opaque UUIDs only; never emit personal names in `properties`.
9. Producers must emit Phase 1A event names (`inbound_order_created`, `outbound_order_created`, …) for business metrics — do not rely on superseded `procurement_*` / `assignment_*` names as the active reporting sources.

## Inventory Flow Map

These points are the source-of-truth instrumentation logic for material telemetry that feeds (or protects) the weekly performance report.

### Business-metric flow

1. `inbound_order_created`
We capture `inbound_order_created` because we need to know how much material is purchased or produced per office and programme, and at what cost, which allows Material Cost per Office/Programme to be computed for Laura's weekly report and Elena's L&D planning.

2. `outbound_order_created`
We capture `outbound_order_created` because we need to know which programmes consume material and how many kits or certificates are delivered, which allows Kits Delivered to be aggregated by office and programme each week.

3. `stock_threshold_triggered`
We capture `stock_threshold_triggered` because we need to know how often programme material falls below the configured minimum, which allows Shortage Frequency to act as a leading indicator before enrolment waves are blocked.

4. `kit_cost_variance_detected`
We capture `kit_cost_variance_detected` because we need to know when a supplier's unit cost spikes abnormally versus history, which allows Cost Variance Frequency to prompt renegotiation or alternate sourcing.

5. `direct_stock_edit_rejected`
We capture `direct_stock_edit_rejected` because we need to know whether staff attempt to bypass order-based material traceability, which allows Patricia and ops leads to reinforce training or permissions at the offices where bypass attempts concentrate. This event remains mandatory in the catalogue even though it is not one of the four v1 weekly KPI columns.

### Support telemetry (excluded from weekly report inputs)

1. `user_login_succeeded` / `user_login_failed` / `session_expired`
We capture auth and session events to understand whether operators can reach the backoffice and whether sessions expire mid-workflow. These are **support telemetry** — useful for access-health decisions, **not** inputs to the Weekly Office & Programme Performance Report.

2. `asset_list_viewed`
We capture list views to understand when operators enter the inventory workspace. **Support only** — not a weekly-report KPI input.

3. `office_filter_applied`
We capture office filter changes to understand centralized vs office-specific oversight. **Support only** — not a weekly-report KPI input.

## Phase 2A Capture

### Objective

Create the stub backend ingest endpoint, frontend telemetry service, and initial backoffice instrumentation so telemetry events can be batched and delivered in the correct format without implementing final persistence yet.

### Required Files

- `services/api/app/routers/telemetry.py`
- `services/api/app/schemas/telemetry.py`
- `services/api/app/core/config.py`
- `services/api/app/main.py`
- `uis/backoffice/services/telemetry.ts` or equivalent repo-native service-boundary file
- relevant inventory/auth components and hooks in `uis/backoffice`

### Required Parameters And Behaviors

1. Stub endpoint: `POST /telemetry/events`
2. Request envelope shape: `{ "events": [...] }`
3. Response shape: `{ "received": N }`
4. Batch trigger: every 10 seconds or when queue size reaches 20 events, whichever comes first
5. Reliable flush: `navigator.sendBeacon` on `visibilitychange`
6. Retry policy: up to 3 retries with exponential backoff before dropping the batch
7. Automatic envelope fields: `eventId`, `sessionId`, `userId`, `timestamp`, `schemaVersion`, `requestId`
8. No direct telemetry `fetch` or `axios` usage outside the telemetry service

### Implementation Steps

1. Add a reusable `TelemetryEvent` Pydantic model that mirrors the standard envelope.
2. Add a telemetry router with a temporary `POST /telemetry/events` endpoint.
3. Have the stub endpoint log the number of events received and the `event_type` values.
4. Return HTTP 200 with `{ "received": N }`.
5. Add backend config support for `TELEMETRY_ENDPOINT` to establish the pattern from the start.
6. Create a frontend `TelemetryService` with:
- in-memory local queue
- debounce by time or queue length
- automatic envelope enrichment
- retry with backoff
- `sendBeacon` flush on hidden/tab-close flow
7. Expose a single `track(eventType, properties)` API.
8. Instrument inventory flow events at minimum:
- successful inbound order creation → `inbound_order_created` (with `unit_cost` and material dimensions)
- successful outbound order creation → `outbound_order_created`
- stock threshold and cost variance when applicable
- product/stock list viewed (support)
9. Instrument authentication events (support):
- successful login
- failed login
- session expired

### Phase-Specific Blockers And Gaps

1. No telemetry router or schema exists yet (historical Phase 2A gap; may already be closed in the current workspace).
2. `TELEMETRY_ENDPOINT` may need declaration in backend settings.
3. `sessionId` generation/storage and `userId` auto-enrichment must remain implemented.
4. Inventory forms must emit Phase 1A event names and required material properties, not superseded procurement/assignment names for business metrics.
5. Current inventory forms have pre-submit validation paths; any retained failure telemetry must cover early returns as well as catch blocks.

### Eval Checklist

- Stub or real `POST /telemetry/events` exists, accepts arrays with the `TelemetryEvent` model shape, and returns a success response with received counts
- `TelemetryEvent` reflects the approved standard envelope
- Endpoint URL is read from `NEXT_PUBLIC_TELEMETRY_ENDPOINT` on the frontend and `TELEMETRY_ENDPOINT` is declared in backend config
- `TelemetryService` implements local queue, debounce, `sendBeacon`, and retry
- `TelemetryService` auto-generates `eventId`, `sessionId`, `userId`, `timestamp`, `schemaVersion`, and `requestId`
- No direct telemetry network calls exist outside the telemetry service
- Inventory business-metric events use the approved `event_type` values and property allowlists from `event-schemas.json`
- Failed order attempts are tracked only if retained as support, not as weekly-report KPI inputs
- Product/stock list viewed is tracked as support telemetry on products page load
- No PII such as email, name, or password is emitted
- Browser network inspection shows valid batches and HTTP 200 responses

### Verification

- Trigger at least one inventory list view, one inbound action, and one outbound action from the backoffice
- Inspect browser DevTools network traffic for `/telemetry/events`
- Confirm batch envelope, automatic fields, and response shape
- Confirm business-metric payloads use `inbound_order_created` / `outbound_order_created` with required dimensions

## Phase 2B Storage

### Objective

Replace the stub ingest endpoint with real Supabase/PostgreSQL persistence using bulk insert and per-event validation, while keeping the frontend contract unchanged.

### Required Files

- `services/api/app/models/telemetry.py` or equivalent storage model file
- `services/api/app/routers/telemetry.py`
- `services/api/app/store/telemetry_store.py` or equivalent
- supporting DB/index setup in the current SQLModel/Postgres pattern

### Required Parameters And Behaviors

1. Table name: `telemetry_events`
2. Queryable fixed columns must support:
- `timestamp`
- `event_type`
- `service`
3. JSONB column: `tags`
4. Required indexes:
- index on `timestamp`
- index on `event_type`
- GIN index on `tags`
5. Immutability: no update/delete logic for telemetry rows
6. Real endpoint response shape: `{ "received": N, "stored": M, "rejected": R }`
7. Per-event validation: `TelemetryEvent.model_validate(...)` inside the handler
8. Batch acceptance: invalid events are rejected individually without cancelling the whole batch
9. Insert mode: single bulk insert per batch, not one insert per event

### Implementation Steps

1. Create the `telemetry_events` storage table in Supabase/PostgreSQL.
2. Map each raw `TelemetryEvent` into the storage contract:
- envelope `properties` persisted as JSONB `tags`
- `service` populated as `backoffice` or `platform_api`
3. Add the three required indexes.
4. Replace the stub route implementation with the real handler.
5. Parse the outer envelope loosely as `{ "events": [...] }`.
6. Validate each event individually inside a loop.
7. Count valid and invalid events separately.
8. Bulk insert only the valid rows.
9. Return `{ "received": N, "stored": M, "rejected": R }`.
10. Keep the frontend transparent to the change by preserving HTTP success behavior.

### Phase-Specific Blockers And Gaps

1. No `telemetry_events` table exists yet (historical; may already be closed).
2. No JSONB `tags` persistence or `service` column exists yet (historical; may already be closed).
3. No bulk-insert telemetry store exists yet (historical; may already be closed).
4. Postgres-specific telemetry indexes must be present.
5. The real endpoint must intentionally use per-event validation inside the handler rather than the repo's normal typed-body route style.
6. Phase 1A producers must store mandatory material dimensions inside `tags` for downstream pipeline reads.

### Eval Checklist

- `telemetry_events` table exists in Supabase with the expected columns and indexes
- Real `POST /telemetry/events` performs bulk insert and returns `{ "received", "stored", "rejected" }`
- Invalid events are rejected individually without cancelling the batch
- `TelemetryEvent` Pydantic model is reused unchanged
- Frontend code does not need to change when stub becomes real
- Stored rows populate `event_type`, `timestamp`, `service`, and `tags`
- Stored `tags` JSON preserves approved allowlisted dimensions from this plan (`office`, `product_id`, `product_category`, `programme_id`, `quantity`, `currency`, inbound costs)
- Insert path is one operation per batch, not one per event

### Verification

- Generate real events from the backoffice by completing at least one inbound and one outbound inventory action
- Query `telemetry_events` directly in Supabase
- Send a mixed valid/invalid batch manually and confirm stored vs rejected counts
- Confirm stored business-metric `event_type` values match the Phase 1A catalogue

## Phase 2C Report

### Objective

Create the analytics pipeline and reporting endpoint that transforms stored telemetry into KPI-backed business metrics for Nexova's **legacy / support** assignment-era report surface (`GET /telemetry/report`), using pandas.

**Clarification:** Phase 2C as documented here covers the existing telemetry analysis module and `GET /telemetry/report`. That surface is **not** the Weekly Office & Programme Performance Report. The weekly office/programme rollup is owned by the separate reporting pipeline (`services/reporting/`, destination table `reporting.weekly_office_program_performance`, endpoints under `/reporting/...`) described in [memory-bank/documentation/data-pipeline-CONTEXT.md](/D:/CodingProjects/company-project-ft-ai-1/memory-bank/documentation/data-pipeline-CONTEXT.md). Do not modify `telemetry_analysis.py` or `GET /telemetry/report` as part of that pipeline milestone unless a later plan explicitly re-scopes them.

### Required Files

- `services/api/domain/telemetry_analysis.py`
- `services/api/app/routers/telemetry.py` or a dedicated report router if kept in the same domain
- any small cache helper used by the reporting endpoint
- backend Docker dependency updates for `pandas`

### Required Parameters And Behaviors

1. At least two independent metric functions
2. Each metric function accepts `start_date` and `end_date`
3. Date window convention:
- inclusive `start_date`
- exclusive `end_date`
- UTC
4. Load filters that belong in SQL:
- `timestamp` range
- `event_type` single value or `IN (...)`
5. Refine in Pandas after load:
- extract `tags` dimensions
- drop null dimension rows
- apply metric-specific row filters
- convert `timestamp` with `pd.to_datetime(..., utc=True)`
- group and aggregate with Pandas only
6. No loops for metric calculation
7. Endpoint: `GET /telemetry/report` (legacy / support report surface)
8. Optional query params: `start_date`, `end_date`
9. Default window when params are omitted: last 7 days
10. Response shape:

```json
{
  "period": { "from": "...", "to": "..." },
  "metrics": {
    "metric_name_1": [...],
    "metric_name_2": [...]
  }
}
```

11. Endpoint cache: 60-second TTL keyed by `start_date`/`end_date`
12. Additional auth metric when included:
- `auth_failure_rate`
- numerator: `user_login_failed`
- denominator: `user_login_failed + user_login_succeeded`

### Implementation Steps

1. Add `pandas` to the backend dependency set used by Docker.
2. Create independent KPI metric functions for the **legacy / support** report surface (historical assignment or auth metrics as implemented).
3. Ensure every function follows the same formula:
- load in SQL
- refine in Pandas
- convert timestamp types
- group
- aggregate
- return JSON-serializable records
4. Create `GET /telemetry/report`.
5. Compute default window in the endpoint, not inside metric functions.
6. Call every metric function with the resolved window.
7. Add a 60-second in-memory cache keyed by requested period.

### Phase-Specific Blockers And Gaps

1. `pandas` must be installed in the backend environment.
2. Reporting depends on storage contract stability, especially `event_type`, `timestamp`, `service`, and `tags`.
3. Assignment-era metric functions may still reference superseded event names until intentionally migrated; they remain separate from the weekly pipeline sink.
4. Weekly Office & Programme Performance aggregation must not be bolted onto `GET /telemetry/report` without an explicit plan change.

### Eval Checklist

- `services/api/domain/telemetry_analysis.py` exists and contains at least two independent metric functions
- Each metric follows `load (SQL) -> refine (Pandas) -> convert types -> group -> aggregate`
- Timestamps are converted to timezone-aware datetimes before grouping
- No loops are used for metric calculations
- Metric functions return JSON-serializable lists of dicts
- `GET /telemetry/report` accepts optional `start_date` and `end_date`
- Endpoint defaults to last 7 days when omitted
- Endpoint returns `{ "period": {...}, "metrics": {...} }`
- In-memory cache uses a 60-second TTL and avoids recalculating identical requests
- Returned metrics answer KPI-backed business questions with grouping dimensions, not only global totals
- Weekly pipeline KPIs are documented and owned separately from this endpoint

### Verification

- Query report endpoint with default dates and an explicit custom range
- Verify repeated requests inside 60 seconds reuse cache
- Inspect one metric output to ensure grouping dimension is preserved
- Confirm stakeholders do not treat `GET /telemetry/report` as the Weekly Office & Programme Performance deliverable

## Risks And Exclusions

### Risks

1. Missing reorder threshold on the product model blocks correct `stock_threshold_triggered` emission.
2. Missing `programme_id`, `currency`, or inbound `unit_cost` blocks Material Cost and office/programme rollups.
3. If producers continue emitting superseded `procurement_*` / `assignment_*` names for business metrics, the weekly pipeline will under-count or miss KPIs.
4. If a future implementation emits raw validation payloads, it may leak sensitive or low-quality data into telemetry.
5. Confusing `GET /telemetry/report` with the weekly reporting pipeline sink will produce the wrong architecture and ownership boundaries.
6. The legacy report phase depends on `pandas` in the backend Docker image.

### Exclusions

1. No keystroke-level tracking inside forms.
2. No employee, candidate, client, consultant, or agent names, emails, or human-readable identity attributes in telemetry `properties`.
3. No currency conversion at the telemetry layer or in v1 of the weekly pipeline.
4. No generic "just in case" events without a linked hypothesis and decision.
5. No attempt to infer stock-threshold events from UI state alone; threshold evaluation belongs in the API/business layer after stock mutation succeeds.
6. Support telemetry (auth, session, list view, office filter) is excluded from Weekly Office & Programme Performance KPI inputs.
7. `GET /telemetry/report` assignment KPIs are excluded as the weekly pipeline sink.

## Canonical Schemas

The event-level allowlists and payload details remain in [docs/telemetry/event-schemas.json](/D:/CodingProjects/company-project-ft-ai-1/docs/telemetry/event-schemas.json). That file is the machine-readable contract: it **must** define the five mandatory business-metric `event_type` values and documents superseded older names under `supersededEvents`.
