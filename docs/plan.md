# Milestone 3 Plan - Talent Pipeline Tracker

## Objective
Build a Next.js App Router frontend for Nexova’s People and Talent team to manage candidate records using the Tracker API, with clear async UX states and context-aligned terminology.

## Target App Path
Use the exact milestone path used for initialization:
- /apps/talent-pipeline-tracker

## Inputs Used
- Milestone setup and evaluation screenshots
- talent-pipeline-tracker context
- API behavior validated from live runs
- API reference in docs/api-ref.md

## Non-Negotiable Constraints
1. Use Next.js App Router with TypeScript.
2. Use only React state and hooks for state management.
3. Do not use external global state libraries.
4. Handle all API calls asynchronously.
5. Show loading, success, and error states for each async operation.
6. Never show raw API status or stage values in visible UI.
7. Notes must only appear in candidate detail view.
8. Navigation between list and detail must be client-side routing without full page reload.

## UI Terminology Mapping
Status mapping:
1. received -> Received
2. in_progress -> In progress
3. selected -> Selected
4. discarded -> Discarded

Stage mapping:
1. pending -> Pending review
2. review -> Under review
3. personal_interview -> Personal interview
4. technical_interview -> Technical interview
5. offer_presented -> Offer presented

Rule:
1. Raw values like in_progress and personal_interview must not be rendered to users.

## API Contract for This Milestone
Base URL:
1. https://playground.4geeks.com/tracker/api/v1

Routes:
1. GET /records
2. POST /records
3. GET /records/{id}
4. PUT /records/{id}
5. PATCH /records/{id}
6. DELETE /records/{id}
7. GET /records/{id}/notes
8. POST /records/{id}/notes
9. DELETE /records/{id}/notes/{note_id}

Observed response behavior to rely on:
1. GET /records returns pagination object with total, page, limit, data.
2. GET /records/{id}/notes returns wrapper object with data and meta.total.
3. DELETE routes return 204 with empty body.
4. GET /records/{id} can return 404 with error message when record does not exist.
5. Validation failures return 422 with detail array.

## Planned Folder Structure
Inside /apps/talent-pipeline-tracker:
1. app
2. app/page.tsx
3. app/candidates/[id]/page.tsx
4. components
5. components/candidates
6. components/filters
7. components/forms
8. components/notes
9. hooks
10. hooks/useCandidates.ts
11. hooks/useCandidateDetail.ts
12. hooks/useNotes.ts
13. hooks/useQueryFilters.ts
14. lib
15. lib/api-client.ts
16. lib/mappers.ts
17. lib/query.ts
18. types
19. types/api.ts
20. types/domain.ts
21. services
22. services/records.ts
23. services/notes.ts
24. .env.local

## Delivery Plan by Phase

### Phase 1 - Bootstrap and Configuration
1. Initialize Next.js project with TypeScript, App Router, Tailwind, ESLint.
2. Add NEXT_PUBLIC_API_URL to .env.local.
3. Create shared API client helper with consistent error parsing.

Exit criteria:
1. App boots locally.
2. API base URL reads from environment.

### Phase 2 - Types and Mapping Layer
1. Define API types for Record, Note, list response, notes response, error responses.
2. Define optional UI-domain helper types where useful.
3. Build centralized status and stage label mappers.

Exit criteria:
1. Strict typing for API payloads.
2. All status and stage rendering goes through mapper functions.

### Phase 3 - Candidate List Page
Route:
1. /

Features:
1. Fetch candidates from GET /records.
2. Render name, position, status label, stage label.
3. Add filter by status and stage.
4. Add search by name or email.
5. Keep filter and search state in query parameters.
6. Update list without full page reload.
7. Show loading, empty, and error states.

Exit criteria:
1. List requirements are fully covered.

### Phase 4 - Candidate Detail Page
Route:
1. /candidates/[id]

Features:
1. Fetch candidate with GET /records/{id}.
2. Display all required fields: full name, email, phone, position, LinkedIn URL, CV URL, years of experience, status label, stage label, applied date.
3. Add status update control using PATCH /records/{id}.
4. Add stage update control using PATCH /records/{id}.
5. Reflect updates immediately in UI state.

Exit criteria:
1. Detail page loads correct candidate by ID.
2. Status and stage updates work with visible feedback.

### Phase 5 - Notes Management in Detail View
Features:
1. Fetch notes with GET /records/{id}/notes.
2. Show notes only on detail page.
3. Create note with POST /records/{id}/notes.
4. Delete note with DELETE /records/{id}/notes/{note_id}.
5. Refresh note list state after add or delete.

Exit criteria:
1. Note list, add, and delete work in detail view only.

### Phase 6 - Candidate Registration and Editing
Features:
1. Create candidate form using POST /records.
2. Edit candidate form using PUT /records/{id}.
3. Include all API-required fields in both forms.
4. Show success and error feedback after submission.

Exit criteria:
1. Candidate create and update flows complete and stable.

### Phase 7 - Async UX and Error Handling
1. Standardize loading, success, and error rendering across pages and components.
2. Parse and show meaningful messages for 422 validation errors.
3. Handle 404 on detail route gracefully.
4. Ensure UI updates after mutations without reload.

Exit criteria:
1. No silent failures.
2. Every async operation has visible user feedback.

### Phase 8 - Final Rubric Validation
Checklist:
1. Candidate list renders API data correctly.
2. Status and stage filters work via query params without reload.
3. Search by name and email works without reload.
4. Detail page shows all required fields for correct candidate.
5. Status and stage can be updated from detail view.
6. Notes can be listed, added, and deleted from detail view.
7. New candidates can be created via POST form.
8. Existing candidate data can be edited via PUT form.
9. Loading, success, and error states are visible for all async operations.
10. TypeScript types are defined and used for API data structures.
11. Folder structure separates components, types, and data access logic.
12. App Router navigation and dynamic routes are used correctly.
13. UI labels and terminology match Nexova context.

## Recommended Execution Order
1. Bootstrap app and env.
2. Implement types and label mappers.
3. Implement API services.
4. Build list page with query-based filters and search.
5. Build detail page and patch controls.
6. Implement notes management.
7. Implement create and edit forms.
8. Add consistent async feedback and error polish.
9. Run full rubric pass and fix remaining gaps.

## Risks and Mitigations
1. API response shape mismatch.
2. Mitigation: use observed response contracts from verified API behavior and defensively parse payloads.
3. Raw API values accidentally shown in UI.
4. Mitigation: enforce mapper usage at render boundary.
5. Query param and local state drift.
6. Mitigation: centralize query parsing and update helpers.
7. Stale UI after mutations.
8. Mitigation: refetch targeted resources after successful writes.

## Plan Approval Checklist
1. Uses /apps/talent-pipeline-tracker path.
2. Aligns with verified API routes and response shapes.
3. Applies required Nexova terminology mapping.
4. Covers every evaluation criterion from the rubric.
5. Ready to convert into implementation tasks immediately.
