# Rule: Frontend Data Boundaries

- Rule ID: FE-001
- Scope Type: file-pattern-based
- Applies To: `uis/**`, `apps/**`, `components/**`, `hooks/**`
- Enforcement: blocking

## Rule

Frontend surfaces must preserve clean data boundaries:

1. UI must never render raw API enum values.
2. Components must not call fetch directly.
3. API calls must be routed through service modules and shared API client utilities.
4. Async operations must render loading and error states.

## Acceptance Criteria

- Status/stage UI text is label-mapped, not raw API values.
- Fetch calls are absent from component files.
- Service functions are used for all remote operations.
- Loading and error states are present for each async action path.
