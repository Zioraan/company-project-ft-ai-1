# Telemetry Phase 2A Capture — Implementation Plan

Working copy for Phase 2A Capture. Storage and Report are separate plans.

## Status

- [x] Backend stub (`TelemetryEvent`, `POST /telemetry/events`, config)
- [x] Frontend `TelemetryService` (queue, debounce, sendBeacon, retry, envelope)
- [x] Normalizers + schema extensions (auth / office filter)
- [x] Inventory + auth instrumentation
- [x] Tests + `docs/eval-traceability-telemetry.md` E-T1x
- [x] Phase gate: await review before Phase 2B Storage

Phase 2A Capture implementation complete. E-T01–E-T12 marked Pass in `docs/eval-traceability-telemetry.md`. **Do not start Storage until explicitly approved.**

## Sources

- `docs/telemetry/telemetry-plan.md` § Phase 2A
- `docs/telemetry/event-schemas.json`
