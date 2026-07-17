# Pipeline Phase 1A — Telemetry Contract and Instrumentation Implementation Plan

Working copy for Phase 1A. Depends on Phase 1 acceptance. Downstream: Phase 2 (reporting), Phase 3 (Prefect).

## Status

- [x] Update `docs/telemetry/telemetry-plan.md` to material KPI framing
- [x] Update `docs/telemetry/event-schemas.json` for mandatory material events and properties
- [ ] Extend inventory domain: `programme_id`, product categories, `currency`, `unit_cost`, `reorder_threshold`
- [ ] Rename/replace business-metric producers (`inbound_*` / `outbound_*`)
- [ ] Instrument `stock_threshold_triggered`, `kit_cost_variance_detected`, `direct_stock_edit_rejected`
- [ ] Keep ingest → `telemetry_events` path; prove required properties in `tags`
- [ ] Tests + eval traceability evidence for Phase 1A
- [ ] Update `memory-bank/progress.md` and `project-structure.md`
- [ ] Archive this plan when Phase 1A eval passes

**Phase gate:** Do not start Phase 2 reporting until Phase 1A eval acceptance criteria below all pass.

## Goal

Align the telemetry contract and instrumentation so `telemetry_events` contains the mandatory Nexova material events and dimensions required by the Weekly Office & Programme Performance Report.

## Sources

- `memory-bank/documentation/telemetry-CONTEXT.md`
- `memory-bank/documentation/data-pipeline-CONTEXT.md`
- `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md` § Phase 1A
- `docs/telemetry/event-schemas.json` (current — must change)
- `docs/telemetry/telemetry-plan.md` (current — must change)

## Locked decisions

| Decision | Choice |
| --- | --- |
| Business-metric events | `inbound_order_created`, `outbound_order_created`, `stock_threshold_triggered`, `direct_stock_edit_rejected`, `kit_cost_variance_detected` |
| Event rename for producers | `procurement_order_created` → `inbound_order_created`; `assignment_order_created` → `outbound_order_created` |
| Support telemetry | Auth/session/list/filter events may remain; excluded from reporting KPI input set |
| Inventory truth for dimensions | Persist on ORM — do not fabricate only in client telemetry |
| Product categories | `training_kit` \| `certification` \| `onboarding_equipment` (remap Asset.category allowlist) |
| Cost on inbound | Require `unit_cost` on `AssetEntry`; emit `unit_cost` (and optional `total_cost = unit_cost * quantity`) on `inbound_order_created` |
| Currency | Derive/default from office (`valencia`→`EUR`, `miami`→`USD`); store on entry for audit |
| Shortage detection | Add `reorder_threshold` on `Asset`; emit `stock_threshold_triggered` when post-exit stock &lt; threshold |
| Cost variance | Emit `kit_cost_variance_detected` when new inbound `unit_cost` differs by &gt;10% from last entry for same asset/product |
| Direct stock edit | Instrument reject path: if no direct stock mutation API exists, add an explicit guarded reject handler (or document + emit from any attempted bypass) so the event is proven end-to-end |
| PII | Never put candidate/client/consultant/agent names in `properties` |
| Untouched | `telemetry_analysis.py`, `GET /telemetry/report` |

## Before / after event mapping

| Current / older | Phase 1A required | Treatment |
| --- | --- | --- |
| `procurement_order_created` | `inbound_order_created` | Replace for business-metric reporting; include cost |
| `assignment_order_created` | `outbound_order_created` | Replace for business-metric reporting |
| `stock_threshold_triggered` | `stock_threshold_triggered` | Keep name; align properties to material contract |
| `direct_stock_edit_rejected` | `direct_stock_edit_rejected` | Keep name; align properties; ensure a producer exists |
| _(none)_ | `kit_cost_variance_detected` | Add new required business-metric event |
| auth, list, filter, session | support only | May remain; not KPI inputs |

## Steps

### 1. Documentation contract

#### 1.1 `docs/telemetry/telemetry-plan.md`

- [x] Revise scope to Nexova training/onboarding material telemetry for the Weekly Office & Programme Performance Report
- [x] Separate business-metric telemetry vs support telemetry
- [x] Replace active KPI table with:
  - Material Cost per Office/Programme
  - Kits Delivered
  - Shortage Frequency
  - Cost Variance Frequency
- [x] Center approved events on the five mandatory material types
- [x] Document required properties: `office`, `product_id`, `product_category`, `programme_id`, `quantity`, `currency`
- [x] Document inbound cost: `unit_cost` or `total_cost`
- [x] Demote procurement/assignment naming to historical/current-state notes — must not remain the active source for the reporting pipeline
- [x] Keep envelope, batching, storage, and PII constraints where still valid

#### 1.2 `docs/telemetry/event-schemas.json`

- [x] Add/replace business-metric schemas for mandatory event names
- [x] Property allowlists per event
- [x] `product_category`: `training_kit`, `certification`, `onboarding_equipment`
- [x] `office`: `valencia` \| `miami`
- [x] `currency`: `EUR` \| `USD`
- [x] Require `quantity` where volume is measured
- [x] Require `unit_cost` or `total_cost` on `inbound_order_created`
- [x] Encode before/after mapping in descriptions or adjacent docs
- [x] Keep support events only if clearly separated from business-metric pipeline contract

### 2. Inventory domain field extension

Extend end-to-end so producers emit real values:

#### Backend

- [ ] `services/api/app/models/inventory.py`
  - `Asset`: add `programme_id`, remapped `category` values, `reorder_threshold` (int, default sensible e.g. 5)
  - `AssetEntry`: add `currency`, `unit_cost` (numeric)
- [ ] `services/api/app/schemas/inventory.py` — request/response fields
- [ ] `services/api/app/store/inventory_store.py` — persist + compute current stock post-exit
- [ ] `services/api/app/routers/inventory.py` — accept new fields; after exit create, return stock + whether threshold crossed; after entry create, return variance flag/details when &gt;10%
- [ ] `services/api/app/seed/inventory_seed.py` — seed programmes, categories, thresholds, unit costs matching telemetry-CONTEXT seed guidance (6–8 materials, ≥3 programmes, both offices)
- [ ] Inventory API tests in `tests/test_inventory_api.py` for new validation rules

#### Frontend

- [ ] `uis/backoffice/types/inventory.ts`
- [ ] `uis/backoffice/services/inventory.ts` (payload types)
- [ ] `uis/backoffice/components/inventory/AssetEntryForm.tsx` — `unit_cost`, programme/category if editable on create path used by form
- [ ] `uis/backoffice/components/inventory/AssetExitForm.tsx` — ensure programme/office/product context available for outbound event
- [ ] `uis/backoffice/lib/telemetry-normalize.ts` — map categories/offices to allowed enums
- [ ] Mapper tests / inventory mapper tests updated for labels

### 3. Producer instrumentation

#### 3.1 Inbound / outbound rename

- [ ] `AssetEntryForm.tsx`: emit `inbound_order_created` with `product_id`, `product_category`, `programme_id`, `quantity`, `currency`, `unit_cost` (and/or `total_cost`); stop using `procurement_order_created` for business metrics
- [ ] Keep a distinct failure event name only if still needed for support (`inbound_order_failed` or retain procurement_failed as support — do not feed reporting KPIs)
- [ ] `AssetExitForm.tsx`: emit `outbound_order_created` with required material properties; stop using `assignment_order_created` for business metrics
- [ ] Remove personal names from exit telemetry (`assigned_to` must not go into properties if it is a person name — use programme/kit identifiers only)

#### 3.2 Shortage

- [ ] After successful outbound create, if `current_stock < reorder_threshold`, emit `stock_threshold_triggered` with material properties
- [ ] Prefer: API computes threshold flag; UI tracks event (or server-side insert into telemetry if a shared helper is added — UI track via existing `TelemetryService` is the default pattern)

#### 3.3 Cost variance

- [ ] On inbound create, compare `unit_cost` to previous entry for same `asset_id`
- [ ] If absolute relative change &gt; 0.10, emit `kit_cost_variance_detected` with product/programme/office/currency and cost delta context (no PII)

#### 3.4 Direct stock edit rejected

- [ ] Identify or add a path that rejects direct stock mutation (no silent invent)
- [ ] On rejection, emit `direct_stock_edit_rejected` with office/product identifiers
- [ ] Ensure at least one automated test fires and stores this event type

### 4. Ingest path (keep)

- [ ] Confirm `POST /telemetry/events` still validates envelopes and stores into `telemetry_events`
- [ ] Confirm required properties land in `tags` JSON via existing store mapping
- [ ] No writes from this phase into reporting tables

### 5. Tests and traceability

- [ ] `tests/telemetry.test.ts` — new event names, normalizers, PII stripping still works
- [ ] `tests/test_telemetry_api.py` — batches with mandatory events store; properties preserved
- [ ] Inventory + telemetry integration coverage for threshold and variance emission paths
- [ ] Update `docs/eval-traceability-telemetry.md` with Phase 1A evidence rows (Pass when done)
- [ ] Confirm no test asserts personal names in properties

### 6. Close Phase 1A

- [ ] Update `memory-bank/progress.md`
- [ ] Update `project-structure.md` if inventory fields / docs change the structural map
- [ ] Archive this plan to `memory-bank/past-implementations/`
- [ ] Unlock Phase 2 plan

## Eval acceptance criteria (Phase 1A)

Phase 1A is complete only if all are true:

- [ ] `docs/telemetry/event-schemas.json` defines:
  - `inbound_order_created`
  - `outbound_order_created`
  - `stock_threshold_triggered`
  - `direct_stock_edit_rejected`
  - `kit_cost_variance_detected`
- [ ] Mandatory properties represented consistently: `office`, `product_id`, `product_category`, `programme_id`, `quantity`, `currency`
- [ ] Inbound events include `unit_cost` or `total_cost`
- [ ] `product_category` uses `training_kit`, `certification`, `onboarding_equipment`
- [ ] Producers emit new event names (not procurement/assignment) for business metrics
- [ ] Valid events still persist into `telemetry_events`
- [ ] Tests prove new names + required properties captured and stored
- [ ] No personal names in telemetry `properties`
- [ ] `event-schemas.json` is the canonical machine-readable contract for material events
- [ ] `telemetry-plan.md` no longer presents procurement/assignment KPI model as the active plan

## Files touched (expected)

| Area | Paths |
| --- | --- |
| Docs | `docs/telemetry/telemetry-plan.md`, `docs/telemetry/event-schemas.json`, `docs/eval-traceability-telemetry.md` |
| Inventory API | `services/api/app/models/inventory.py`, `schemas/inventory.py`, `store/inventory_store.py`, `routers/inventory.py`, `seed/inventory_seed.py` |
| Producers | `uis/backoffice/components/inventory/AssetEntryForm.tsx`, `AssetExitForm.tsx`, `lib/telemetry-normalize.ts`, `lib/telemetry-failure-reasons.ts`, types/services under backoffice inventory |
| Tests | `tests/telemetry.test.ts`, `tests/test_telemetry_api.py`, `tests/test_inventory_api.py`, inventory mapper tests as needed |
| Memory | `memory-bank/progress.md`, `project-structure.md` |

Likely unchanged (ingest keep): `services/api/app/routers/telemetry.py`, `schemas/telemetry.py`, `models/telemetry.py`, `store/telemetry_store.py` unless allowlist validation is tightened.

## Non-goals

- Reporting table / KPI aggregation (Phase 2)
- Prefect / pipeline CLI (Phase 3)
- Redesigning the telemetry envelope schema
- Currency conversion
- Replacing support telemetry for auth/list/filter
- Modifying `GET /telemetry/report` or `telemetry_analysis.py`

## Dependencies

- Requires Phase 1 accepted
- Unlocks Phase 2

## Related phase plans

- Phase 1: `memory-bank/documentation/pipeline-phase-1-implementation-plan.md`
- Phase 2: `memory-bank/documentation/pipeline-phase-2-implementation-plan.md`
- Phase 3: `memory-bank/documentation/pipeline-phase-3-implementation-plan.md`
