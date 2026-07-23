# Supplier Directory Handoff

## Purpose

This document translates the imported supplier-directory assignment into the current monorepo structure used in this workspace. It is intended as handoff context for another agent that will generate the implementation plan.

## Confirmed Decisions

- Seeding must happen both on API startup and through a manual seed entrypoint.
- `DELETE /suppliers/{id}` is required.
- `/suppliers/[id]` is required.
- TinyDB should live at `services/api/data/suppliers.json` by default.
- TinyDB path should be configurable by environment variable for test isolation and future flexibility.

## Translation Rules

- Treat `memory-bank/CONTEXT-nexova.md` as the source of truth for supplier fields and business rules.
- Ignore the imported standalone project link and its literal folder layout.
- Translate `uis/application` to `uis/backoffice`.
- Translate flat `services/api/*.py` suggestions into the existing `services/api/app/*` layout.
- Keep TinyDB at `services/api/data/suppliers.json` by default, with env override support.
- Keep startup seeding and manual seed execution both supported.
- Keep `DELETE /suppliers/{id}` required.
- Keep `/suppliers/[id]` required.
- Translate the eval rule about monorepo placement into:
  - backend under `services/api/...`
  - frontend under `uis/backoffice/...`

## Source-of-Truth Supplier Fields

Use these exact field names from `memory-bank/CONTEXT-nexova.md`:

- `name`
- `country`
- `categories`
- `monthly_rate`
- `currency`
- `rate_updated_at`
- `status`
- `contract_renewal_date`
- `contact_email`
- `notes`

Do not rename these to screenshot shorthand such as `rate` or `updated_at` if the implementation is expected to match the context exactly.

## Proposed Monorepo File Structure

```text
services/
  api/
    app/
      main.py
      core/
        tinydb.py
      routers/
        incidents.py
        suppliers.py
      schemas/
        incidents.py
        suppliers.py
      seed/
        suppliers_seed.py
      store/
        analysis_store.py
        suppliers_store.py
    data/
      suppliers.json

uis/
  backoffice/
    app/
      suppliers/
        page.tsx
        [id]/
          page.tsx
    components/
      suppliers/
        SupplierDirectoryClient.tsx
        SupplierTable.tsx
        SupplierFiltersBar.tsx
        SupplierCreateForm.tsx
        SupplierRateEditor.tsx
        SupplierStatusToggle.tsx
        SupplierDetailCard.tsx
    hooks/
      useSuppliers.ts
      useSupplierDetail.ts
    services/
      suppliers.ts
    lib/
      suppliers-api-client.ts
      suppliers-mappers.ts
      suppliers-query.ts
    types/
      suppliers.ts

tests/
  test_suppliers_api.py
  suppliers-mappers.test.ts
  suppliers-query.test.ts
```

## File-by-File Handoff Checklist

### Backend

- `services/api/app/main.py`
  - Register the suppliers router.
  - Run startup seeding during app boot.
  - Keep existing incidents routes working.

- `services/api/app/core/tinydb.py`
  - Centralize TinyDB initialization.
  - Default DB path to `services/api/data/suppliers.json`.
  - Support env override for alternate DB paths.
  - Ensure the `data/` directory exists before initialization.

- `services/api/app/schemas/suppliers.py`
  - Add supplier create, response, rate update, and status update models.
  - Enforce exact context fields.
  - Reject invalid `status` values with validation.
  - Reject zero or negative `monthly_rate`.
  - Reject invalid `country` and `currency` combinations.
  - Keep `rate_updated_at` system-generated only.

- `services/api/app/store/suppliers_store.py`
  - Implement TinyDB-backed create, list, detail, update, status, and delete behavior.
  - Implement filtering by `country` and `category`.
  - Update `rate_updated_at` automatically when `monthly_rate` changes.
  - Make seeding idempotent.
  - Ensure persisted data survives restart.

- `services/api/app/seed/suppliers_seed.py`
  - Store the canonical supplier seed data.
  - Provide reusable seed logic used by both startup and manual seeding.
  - Prevent duplicates on repeated runs.
  - Return inserted and skipped counts.

- `services/api/app/seed/__main__.py` or equivalent seed entrypoint
  - Provide manual seed execution.
  - Print inserted and skipped totals to the console.
  - Satisfy the manual seed execution requirement.

- `services/api/app/routers/suppliers.py`
  - Implement:
    - `POST /api/suppliers`
    - `GET /api/suppliers`
    - `GET /api/suppliers/{id}`
    - `PATCH /api/suppliers/{id}/rate`
    - `PATCH /api/suppliers/{id}/status`
    - `DELETE /api/suppliers/{id}`
  - Support `country` and `category` query filters.
  - Return `404` for non-existent IDs.
  - Let invalid payloads surface as `422`.

- `services/api/data/suppliers.json`
  - Treat as runtime storage created by the app.
  - The implementation plan should decide whether to commit an initial file or let it be created automatically.

- `tests/test_suppliers_api.py`
  - Add API coverage for create, list, detail, rate update, status update, and delete.
  - Test all-suppliers list with no filters.
  - Test `country` filter.
  - Test `category` filter.
  - Test missing ID `404`s for detail and delete.
  - Test invalid `status` returns `422`.
  - Test zero and negative `monthly_rate` return `422`.
  - Test `rate_updated_at` changes on rate update.
  - Test repeated seeding does not duplicate records.
  - Test persistence behavior across reinitialization if feasible with isolated temp DB setup.

### Frontend

- `uis/backoffice/types/suppliers.ts`
  - Define request, response, and domain types for supplier flows.

- `uis/backoffice/lib/suppliers-api-client.ts`
  - Add low-level client helpers for supplier endpoints.
  - Keep response and error normalization consistent with current backoffice patterns.

- `uis/backoffice/services/suppliers.ts`
  - Expose supplier API operations through the service boundary.
  - Keep fetch logic out of React components.

- `uis/backoffice/lib/suppliers-mappers.ts`
  - Map supplier API values into UI-safe display labels.
  - Ensure status and category display is intentional and not raw/internal-looking.

- `uis/backoffice/lib/suppliers-query.ts`
  - Parse and serialize URL filter state for `country` and `category`.

- `uis/backoffice/hooks/useSuppliers.ts`
  - Add SWR-backed list hook.
  - Support filter-driven refresh.
  - Support immediate UI refresh after create, rate update, status change, and delete.

- `uis/backoffice/hooks/useSupplierDetail.ts`
  - Add SWR-backed detail hook for `/suppliers/[id]`.

- `uis/backoffice/components/suppliers/SupplierDirectoryClient.tsx`
  - Compose the supplier list page.
  - Load suppliers from the API.
  - Handle loading and error states.
  - Coordinate form and row-level mutations.

- `uis/backoffice/components/suppliers/SupplierFiltersBar.tsx`
  - Add country and category filters.
  - Update the list without full page reload.
  - Keep state synced to the URL.

- `uis/backoffice/components/suppliers/SupplierTable.tsx`
  - Display the context-defined fields needed for the list view.
  - Include row actions for rate update, status change, and delete.
  - Visually distinguish active vs suspended suppliers.

- `uis/backoffice/components/suppliers/SupplierCreateForm.tsx`
  - Validate required fields on the client side.
  - Submit to the API.
  - Display server validation errors clearly if rejected.

- `uis/backoffice/components/suppliers/SupplierRateEditor.tsx`
  - Update `monthly_rate`.
  - Reflect the change immediately after API success.

- `uis/backoffice/components/suppliers/SupplierStatusToggle.tsx`
  - Update active and suspended status.
  - Reflect changes immediately after API success.

- `uis/backoffice/components/suppliers/SupplierDetailCard.tsx`
  - Render required supplier detail data for `/suppliers/[id]`.
  - Support detail-level actions if included.

- `uis/backoffice/app/suppliers/page.tsx`
  - Add the supplier directory page under backoffice.

- `uis/backoffice/app/suppliers/[id]/page.tsx`
  - Add the required supplier detail page.

- `tests/suppliers-mappers.test.ts`
  - Cover UI mapping behavior for status and category display.

- `tests/suppliers-query.test.ts`
  - Cover query parse and serialize behavior for URL-synced filters.

## Evaluation Translation

The screenshot evals should be interpreted in this repo as the following acceptance checklist.

### Model and Validation

- The Pydantic supplier models must reflect exactly the context-defined fields from `memory-bank/CONTEXT-nexova.md`.
- Invalid `status` values must be rejected with `422` before persistence.
- Zero or negative `monthly_rate` values must be rejected with `422`.
- `rate_updated_at` must be generated by the system, not accepted from the client.

### Seeder

- Manual seed execution must run without errors and load the context suppliers.
- Running the seeder more than once must not create duplicates.
- Seed execution must report inserted and skipped totals in console output.
- Startup boot must also perform safe idempotent seeding.

### Endpoints

- `POST /api/suppliers` creates a supplier and returns the complete object with ID.
- `GET /api/suppliers` with no params returns all suppliers.
- `GET /api/suppliers?country=X` returns only suppliers from that country.
- `GET /api/suppliers?category=Y` returns only suppliers in that category.
- `GET /api/suppliers/{id}` returns `404` for non-existent IDs.
- `PATCH /api/suppliers/{id}/rate` updates the rate and records the timestamp change.
- `PATCH /api/suppliers/{id}/status` rejects invalid status values with `422`.
- `DELETE /api/suppliers/{id}` returns `404` for non-existent IDs.

### Frontend

- The supplier list must load from the API and display the context-defined fields needed for the directory.
- Country and category filters must work without full page reload.
- The create form must validate required fields client-side and surface API errors if the server rejects input.
- Rate updates and status changes must be reflected in the UI after the API responds.
- Active and suspended suppliers must be visually distinguishable.

### Cross-Cutting

- TinyDB persistence must survive restart.
- HTTP status behavior must be consistent:
  - `200` or `201` on success
  - `404` when resource not found
  - `422` for invalid input
- Code organization must follow this monorepo's structure, translated from the screenshot as:
  - backend: `services/api/...`
  - frontend: `uis/backoffice/...`

## Handoff Note

The next agent should treat the evals as implementation-shaping constraints, not just test ideas. In particular, the exact field names, the `422` validation behavior, idempotent seeding, persistence across restart, and monorepo-aligned folder placement should all be considered required acceptance criteria.
