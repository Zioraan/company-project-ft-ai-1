# Talent Tracker API Reference

## Base URL
https://playground.4geeks.com/tracker/api/v1

## Purpose
Reference for the Talent Pipeline Tracker API routes confirmed from route-by-route screenshots.
This file is optimized for implementation work in the next project stage.

## Authentication
No authentication token is required for this project.

Suggested headers:
- Content-Type: application/json
- Accept: application/json

## Domain Enums
### Record status
- received
- in_progress
- selected
- discarded

### Record stage
- pending
- review
- personal_interview
- technical_interview
- offer_presented

## Core Entities
### Record (inferred from examples)
- id: string
- full_name: string
- email: string
- phone: string
- position: string
- linkedin_url: string
- cv_url: string
- status: string
- stage: string
- experience_years: number
- notes_count: number
- applied_at: string (datetime)
- updated_at: string (datetime)

### Note (inferred)
- id: string
- record_id: string
- content: string
- created_at: string (datetime)

## Endpoint Catalog
| Method | Path | Purpose | Success | Validation Error |
| --- | --- | --- | --- | --- |
| GET | /records | List records with filtering and pagination | 200 | 422 |
| POST | /records | Create a record | 201 | 422 |
| GET | /records/{id} | Get one record by id | 200 | 422 |
| PUT | /records/{id} | Replace entire record | 200 | 422 |
| PATCH | /records/{id} | Partial update (status/stage) | 200 | 422 |
| DELETE | /records/{id} | Delete record by id | 204 | 422 |
| GET | /records/{id}/notes | List notes for a record | 200 | 422 |
| POST | /records/{id}/notes | Add note to a record | 201 | 422 |
| DELETE | /records/{id}/notes/{note_id} | Delete specific note | 204 | 422 |

## Route Details
## GET /records
Purpose: Return paginated records list with optional filters.

Query parameters:
- status: string. Allowed: received, in_progress, selected, discarded
- stage: string. Allowed: pending, review, personal_interview, technical_interview, offer_presented
- search: string. Searches in full_name or email
- page: integer. Default 1
- limit: integer. Default 20

Possible responses (from docs screenshot):
- 200 Successful Response
  - Media type: application/json
  - Example value: "string"
- 422 Validation Error
  - Media type: application/json
  - Example shape:
    - detail: array
      - loc: array
      - msg: string
      - type: string

Observed response shape from executed example (200):
- total: number
- page: number
- limit: number
- data: Record[]

## POST /records
Purpose: Create a new candidate record.

Request body (required):
- full_name: string
- email: string
- phone: string
- position: string
- linkedin_url: string
- cv_url: string
- experience_years: number

Response:
- 201 with created Record
- 422 validation error

## GET /records/{id}
Purpose: Fetch one record by id.

Path params:
- id: string (required)

Response:
- 200 success
- 404 when record does not exist (observed after deletion)
- 422 validation error

## PUT /records/{id}
Purpose: Replace a full record.

Path params:
- id: string (required)

Request body (required):
- full_name: string
- email: string
- phone: string
- position: string
- linkedin_url: string
- cv_url: string
- experience_years: number

Response:
- 200 with updated Record
- 422 validation error

## PATCH /records/{id}
Purpose: Partial update of process progression fields.

Path params:
- id: string (required)

Request body (required in docs sample):
- status: string
- stage: string

Response:
- 200 with updated Record
- 422 validation error

## DELETE /records/{id}
Purpose: Delete a record.

Path params:
- id: string (required)

Response:
- 204 success
- 422 validation error

## GET /records/{id}/notes
Purpose: Retrieve notes for a specific record.

Path params:
- id: string (required)

Response:
- 200 success
  - Observed shape:
    - data: Note[]
    - meta:
      - total: number
- 422 validation error

## POST /records/{id}/notes
Purpose: Create a note linked to a record.

Path params:
- id: string (required)

Request body (required):
- content: string

Response:
- 201 success
- 422 validation error

## DELETE /records/{id}/notes/{note_id}
Purpose: Delete a specific note.

Path params:
- id: string (required)
- note_id: string (required)

Response:
- 204 success
- 422 validation error

## Common Error Shape
Observed for 422 responses:
- detail: array of validation issues
  - loc: array
  - msg: string
  - type: string

Observed for 404 response (GET /records/{id} after delete):
- error: string

## Practical Integration Workflow
1. Use GET /records for dashboard listing and filters.
2. Create records with POST /records.
3. Update lifecycle using PATCH /records/{id} as stage/status changes.
4. Keep full-edit UI with PUT /records/{id}.
5. Manage internal comments with /records/{id}/notes endpoints.
6. Use DELETE routes for cleanup actions.

## Confidence Notes
- This reference was built from individual route screenshots validated by user.
- Keep this as canonical route list for next stage.
- If live docs differ, update this file first to keep implementation and docs aligned.

## Live Verification Run (2026-05-18)
Executed route sequence in required order against one created record.

Created test record:
- id: 6ee3abfb-99cc-4f63-b93d-0fa7682784ce

Created test note:
- id: f1e5c79e-d50a-4a17-9837-4cdbad619d13

Observed statuses:
1. GET /records -> 200
2. POST /records -> 201
3. GET /records/{id} -> 200
4. POST /records/{id}/notes -> 201
5. GET /records/{id}/notes -> 200
6. DELETE /records/{id}/notes/{note_id} -> 204
7. GET /records/{id}/notes (confirm) -> 200 (empty list)
8. GET /records/{id} (confirm) -> 200 (notes_count 0)
9. PUT /records/{id} -> 200
10. GET /records/{id} (confirm) -> 200
11. PATCH /records/{id} -> 200
12. GET /records/{id} (confirm) -> 200
13. DELETE /records/{id} -> 204
14. GET /records/{id} (confirm) -> 404 with {"error":"Record not found"}

Additional concrete findings:
- GET /records response includes pagination and data list: total, page, limit, data.
- Record objects can include notes (embedded) and notes_count in list endpoint.
- GET /records/{id}/notes returns object wrapper ({ data, meta }) instead of a bare array.
- PUT /records/{id} preserved status/stage when those fields were not in body during this run.
- PATCH /records/{id} successfully changed status and stage only.
