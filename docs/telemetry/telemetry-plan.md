# Nexova Telemetry Plan

## Scope

This plan defines the telemetry needed for Nexova's inventory management flow in the monorepo backoffice and platform API. It is aligned to the active company context in [memory-bank/documentation/telementry-plan-CONTEXT.md](/D:/CodingProjects/company-project-ft-ai-1/memory-bank/documentation/telementry-plan-CONTEXT.md) and uses the canonical business entity names `Asset`, `ProcurementOrder`, and `AssignmentOrder`.

The plan covers:

- KPI-backed instrumentation for the inventory module.
- Supporting backoffice telemetry for authentication and navigation.
- A standard event envelope.
- Event schemas with property allowlists.
- Delivery-mode decisions, throttle strategy, and risks/exclusions.

## KPI Analysis

| KPI | What data makes it up | Where the data is generated |
| --- | --- | --- |
| `Asset assignment lead time` | `assignment_flow_started.timestamp`, `assignment_order_created.timestamp`, `office`, `asset_id`, `asset_category`, `assigned_to`, `created_by` | Backoffice outbound assignment page and `POST /inventory/orders/outbound` in the platform API |
| `Stock-out frequency by asset category` | `stock_threshold_triggered.timestamp`, `office`, `asset_category`, `current_stock`, `min_stock_threshold`, `trigger_source_order_id` | Platform API after successful outbound assignment processing |
| `Procurement cycle time` | Consecutive `procurement_order_created.timestamp` events for the same `asset_id`, plus `office`, `vendor`, `quantity` | `POST /inventory/orders/inbound` in the platform API |

## Implementation Preconditions

The telemetry contract below follows the canonical Nexova context exactly. The current implementation does not yet fully match that context, so instrumentation work should begin with these normalization steps:

1. Normalize `office` values to lowercase `valencia` and `miami` in telemetry producers, even though the current UI/API types use `Valencia` and `Miami`.
2. Normalize current inventory category values to the canonical telemetry values from context: `hardware`, `software_licence`, `furniture`, `peripheral`, `consumable`.
3. Add `min_stock_threshold` to the persisted `Asset` model before implementing `stock_threshold_triggered`.
4. Add a durable way to identify blocked direct stock edits if a direct stock mutation endpoint is introduced or attempted.
5. Keep `assigned_to`, `created_by`, and `userId` as opaque UUIDs only.

## Inventory Flow Map

This is the operator flow from authenticated access through inbound and outbound inventory completion. Each instrumentation point survives the golden-rule test.

1. `user_login_succeeded`
We capture `user_login_succeeded` because we need to know whether operators can reach the backoffice successfully, which allows us to decide whether inventory friction is caused before the inventory flow even starts.

2. `asset_list_viewed`
We capture `asset_list_viewed` because we need to know when operators enter the inventory workspace and which office view they start from, which allows us to decide whether usage differs by office and whether the stock list is the operational entry point.

3. `assignment_flow_started`
We capture `assignment_flow_started` because we need to know when the lead-time clock begins for an `AssignmentOrder`, which allows us to decide whether onboarding delays happen before or after the operator starts the outbound flow.

4. `assignment_order_failed`
We capture `assignment_order_failed` because we need to know why an `AssignmentOrder` does not complete, which allows us to decide whether the bottleneck is stock availability, validation, or operator behavior.

5. `assignment_order_created`
We capture `assignment_order_created` because we need to know when an `AssignmentOrder` completes successfully, which allows us to decide which office or asset category has slow assignment operations.

6. `stock_threshold_triggered`
We capture `stock_threshold_triggered` because we need to know when an `Asset` reaches or falls below its reorder boundary after an `AssignmentOrder`, which allows us to decide whether procurement should be accelerated before a stock-out occurs.

7. `procurement_order_failed`
We capture `procurement_order_failed` because we need to know why a `ProcurementOrder` was blocked, which allows us to decide whether replenishment friction is due to input quality, unknown vendors, or service validation.

8. `procurement_order_created`
We capture `procurement_order_created` because we need to know when a `ProcurementOrder` is successfully registered, which allows us to decide whether procurement is reactive or proactive for a given `Asset`.

9. `direct_stock_edit_rejected`
We capture `direct_stock_edit_rejected` because we need to know whether operators attempt to bypass the order-based stock model, which allows us to decide whether training, permissions, or UX changes are needed.

## Additional Backoffice Opportunities

These are outside the inventory module but still useful for operational decisions:

1. `session_expired`
We capture `session_expired` because we need to know whether operators are being removed from active sessions mid-workflow, which allows us to decide whether authentication expiry is disrupting inventory completion.

2. `assignment_form_abandoned`
We capture `assignment_form_abandoned` because we need to know whether operators start but do not complete the `AssignmentOrder` flow, which allows us to decide whether the outbound form is confusing or too slow.

3. `office_filter_applied`
We capture `office_filter_applied` because we need to know whether operators frequently switch offices while investigating stock, which allows us to decide whether inventory oversight is centralized or office-specific.

## Standard Event Envelope

Every event must include this envelope:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `eventId` | `string` | yes | UUID generated client-side or server-side |
| `timestamp` | `string` | yes | ISO 8601 UTC timestamp |
| `sessionId` | `string` | yes | Opaque session identifier |
| `userId` | `string` | yes | Authenticated TinyDB user UUID |
| `event_type` | `string` | yes | `entity_action` format |
| `schemaVersion` | `string` | yes | Event schema version |
| `requestId` | `string` | yes | Correlation id shared across request chain |
| `properties` | `object` | yes | Event-specific payload, restricted to allowlist |

## Event Catalog

| Event | Primary entity | Supports KPI | Delivery | Sensitive data |
| --- | --- | --- | --- | --- |
| `assignment_flow_started` | `AssignmentOrder` | Asset assignment lead time | batch | no direct PII, UUID-only identifiers |
| `assignment_order_failed` | `AssignmentOrder` | Asset assignment lead time | stream | UUID-only identifiers, normalized failure reason |
| `assignment_order_created` | `AssignmentOrder` | Asset assignment lead time | stream | UUID-only identifiers, durable audit trail for `software_licence` |
| `stock_threshold_triggered` | `Asset` | Stock-out frequency by asset category | stream | no PII |
| `procurement_order_failed` | `ProcurementOrder` | Procurement cycle time | stream | UUID-only identifiers |
| `procurement_order_created` | `ProcurementOrder` | Procurement cycle time | batch | UUID-only identifiers |
| `direct_stock_edit_rejected` | `Asset` | Stock integrity operational monitoring | stream | UUID-only identifiers |
| `asset_list_viewed` | `Asset` | Supporting navigation signal | batch | no PII |
| `assignment_form_abandoned` | `AssignmentOrder` | Supporting workflow friction signal | batch | UUID-only identifiers |
| `office_filter_applied` | `Asset` | Supporting office segmentation signal | batch | no PII |
| `user_login_succeeded` | `UserSession` | Supporting access-health signal | batch | UUID-only identifiers |
| `user_login_failed` | `UserSession` | Supporting access-health signal | batch | no raw email, normalized reason only |
| `session_expired` | `UserSession` | Supporting access-health signal | batch | UUID-only identifiers |

## Delivery Strategy

### Stream events

Use stream delivery for:

- `assignment_order_created`
- `assignment_order_failed`
- `stock_threshold_triggered`
- `procurement_order_failed`
- `direct_stock_edit_rejected`

These events are tied to immediate operational decisions. A failed onboarding assignment or a low-stock condition for laptops or software licences can block same-day employee setup, so the business urgency is real-time.

### Batch events

Use batch delivery for:

- `assignment_flow_started`
- `procurement_order_created`
- `asset_list_viewed`
- `assignment_form_abandoned`
- `office_filter_applied`
- `user_login_succeeded`
- `user_login_failed`
- `session_expired`

These events support trend analysis, KPI computation, and workflow diagnostics rather than instant intervention. Daily or hourly batches are sufficient.

## Throttle And Debounce Strategy

- `asset_list_viewed`: emit once per route entry, not on every render or refetch.
- `office_filter_applied`: emit only when the selected office value changes.
- `assignment_flow_started`: emit once when the outbound form becomes interactive for a session and selected asset combination.
- `assignment_form_abandoned`: derive after 10 minutes of inactivity or route exit without `assignment_order_created`; emit once per abandoned flow.
- `user_login_failed`: emit once per failed submit attempt, but never include raw email or password-adjacent content.

## Sensitive Data And PII Strategy

- `assigned_to`, `created_by`, and `userId` must be opaque UUIDs only.
- Never capture employee names, emails, free-text notes, supplier contact details, or raw request bodies.
- Failure events must use normalized `failure_reason` codes such as `insufficient_stock`, `missing_assigned_to`, `invalid_quantity`, `unknown_vendor`, `session_expired`.
- `assignment_order_created` for `asset_category = software_licence` must be retained as a durable audit event because of vendor compliance risk.

## Risks And Exclusions

### Risks

1. The current inventory code does not yet persist `min_stock_threshold`, so `stock_threshold_triggered` cannot be implemented exactly as designed until the `Asset` model is extended.
2. The current inventory implementation uses different office and category enums than the Nexova telemetry context, so telemetry producers must normalize values or downstream analytics will drift from the business contract.
3. If a future implementation emits raw validation payloads, it may leak sensitive or low-quality data into telemetry.
4. `software_licence` events require retention discipline and stronger audit durability than ordinary navigation telemetry.

### Exclusions

1. No keystroke-level tracking inside forms.
2. No employee names, emails, or human-readable identity attributes in telemetry.
3. No supplier free-text metadata beyond the specific allowed vendor field on `procurement_order_created`.
4. No generic "just in case" events without a linked hypothesis and decision.
5. No attempt to infer stock-threshold events from UI state alone; threshold evaluation belongs in the API/business layer after stock mutation succeeds.

## Implementation Notes

- Emit navigation and form-start events in the backoffice UI.
- Emit order success, validation failure, threshold, and integrity events in the platform API.
- Prefer API-side emission for authoritative business events because that is where stock mutation and validation are finalized.
- Keep the canonical schemas in [docs/telemetry/event-schemas.json](/D:/CodingProjects/company-project-ft-ai-1/docs/telemetry/event-schemas.json).
