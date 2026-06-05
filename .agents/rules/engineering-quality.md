# Rule: Engineering Quality and Delivery Standards

- Rule ID: ENG-001
- Scope Type: always-active
- Applies To: entire repository
- Enforcement: blocking

## Rule

Changes must preserve platform-quality and delivery guarantees across all surfaces.

## Required Controls

1. UI must not render raw API enum values.
2. Components and presentation layers must not call fetch directly.
3. API calls must route through service boundaries and shared API client utilities.
4. Async operations must render loading and failure states; success state must be observable.
5. Query/filter/page state in list views must remain URL-synced.
6. Forms initialized from async data must resync when source data changes.
7. API validation failures must be shown as actionable feedback.
8. Shared contract types must be centralized; avoid duplicated type drift.
9. Hooks, mappers, and query parser logic require tests before merge.
10. Architecture migrations must use staged cutover with explicit parity checkpoints.

## Acceptance Criteria

- No raw backend enum values appear in user-visible UI.
- No direct fetch usage appears in component/presentation files.
- Async flows expose loading and failure states in UI.
- URL query state and UI filters remain synchronized.
- Form state reflects refreshed source data during navigation/refetch.
- Validation errors are actionable and mapped to relevant fields or summaries.
- Contract changes occur in shared modules used by all consumers.
- Test evidence exists for changed hooks/mappers/query parsing behavior.
- Migration tasks include checkpoint evidence before cutover.
