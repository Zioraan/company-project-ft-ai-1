# Supplier Directory Eval Traceability Matrix

Maps supplier directory milestone criteria to implementation artifacts and verification methods.

## Scope

- TinyDB-backed FastAPI supplier endpoints
- Idempotent startup and manual seeding
- Backoffice supplier directory UI (`/suppliers`, `/suppliers/[id]`)

## Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-S01 | Pydantic models use exact CONTEXT field names | `services/api/app/schemas/suppliers.py` | Schema review + API create test | Pass | `monthly_rate`, `rate_updated_at`, etc. |
| E-S02 | Invalid status rejected with 422 | `SupplierStatusUpdateSchema`, router | `test_invalid_status_returns_422` | Pass | Pydantic literal validation |
| E-S03 | Zero/negative monthly_rate rejected with 422 | `SupplierCreateSchema`, `SupplierRateUpdateSchema` | `test_zero_monthly_rate_returns_422`, `test_negative_monthly_rate_returns_422` | Pass | `Field(..., gt=0)` |
| E-S04 | `rate_updated_at` system-generated only | `suppliers_store.create_supplier`, `update_rate` | `test_rate_update_changes_rate_updated_at` | Pass | Not on request schemas |
| E-S05 | Country/currency pairing enforced | `SupplierCreateSchema` validator | API create with mismatched pair → 422 | Pass | Spain→EUR, USA→USD |
| E-S06 | Manual seed runs without errors | `app/seed/__main__.py` | `python -m app.seed` from `services/api` | Pass | Prints inserted/skipped |
| E-S07 | Repeated seeding is idempotent | `suppliers_store.seed_suppliers` | `test_repeated_seeding_does_not_duplicate` | Pass | Match on name + country |
| E-S08 | Startup boot seeds safely | `app/main.py` lifespan | App boot + list endpoint | Pass | Lifespan calls `seed_suppliers` |
| E-S09 | `POST /api/suppliers` creates full object | `routers/suppliers.py` | `test_create_supplier_returns_complete_object` | Pass | Returns 201 with `id` |
| E-S10 | `GET /api/suppliers` returns all | `list_suppliers_route` | `test_list_suppliers_without_filters` | Pass | Unfiltered array |
| E-S11 | `GET /api/suppliers?country=` filter | `list_suppliers` store | `test_list_suppliers_country_filter` | Pass | Query param filter |
| E-S12 | `GET /api/suppliers?category=` filter | `list_suppliers` store | `test_list_suppliers_category_filter` | Pass | Category membership filter |
| E-S13 | `GET /api/suppliers/{id}` 404 | `get_supplier_route` | `test_get_supplier_detail_404` | Pass | Missing ID |
| E-S14 | `PATCH /api/suppliers/{id}/rate` updates timestamp | `update_rate` store | `test_rate_update_changes_rate_updated_at` | Pass | Timestamp changes on rate change |
| E-S15 | `PATCH /api/suppliers/{id}/status` 422 on invalid | Router + schema | `test_invalid_status_returns_422` | Pass | Invalid enum rejected |
| E-S16 | `DELETE /api/suppliers/{id}` 404 | `delete_supplier_route` | `test_delete_supplier_404` | Pass | Missing ID |
| E-S17 | TinyDB persistence across restart | `core/tinydb.py`, store | `test_persistence_survives_reinitialization` | Pass | Temp DB file reread |
| E-S18 | List loads from API in UI | `SupplierDirectoryClient`, `useSuppliers` | UI review + build | Pass | SWR + service boundary |
| E-S19 | Country/category filters URL-synced | `useSupplierFilters`, `suppliers-query.ts` | `tests/suppliers-query.test.ts` | Pass | `router.replace` pattern |
| E-S20 | Create form client validation + API errors | `SupplierCreateForm.tsx` | UI review | Pass | Required fields + `SuppliersApiError` |
| E-S21 | Rate/status changes reflect immediately | `SupplierTable`, hooks `refetch`/`mutate` | UI review | Pass | Post-mutation refresh |
| E-S22 | Active vs suspended visually distinct | `SupplierTable.tsx`, mappers | `tests/suppliers-mappers.test.ts` | Pass | Badge + row opacity |
| E-S23 | Renewal within 60 days highlighted | `isRenewalSoon`, table/detail UI | Mapper test + UI review | Pass | Accent border/badge |
| E-S24 | Detail route `/suppliers/[id]` | `app/suppliers/[id]/page.tsx` | Build route table | Pass | Dynamic route registered |
| E-S25 | No raw API enums in UI | `suppliers-mappers.ts` | `tests/suppliers-mappers.test.ts` | Pass | Label maps for status/category |
| E-S26 | Service boundary (no fetch in components) | `services/suppliers.ts` | Lint/review | Pass | Components use service only |
| E-S27 | Monorepo placement | `services/api/*`, `uis/backoffice/*` | File tree review | Pass | Matches handoff translation |

## Verification Commands

1. `pip install -r requirements-dev.txt`
2. `pytest tests/test_suppliers_api.py`
3. `npm run test -- tests/suppliers-mappers.test.ts tests/suppliers-query.test.ts`
4. `npm run ci`
5. `npm run build --prefix uis/backoffice`

## Open Items

None for supplier directory criteria E-S01 through E-S27.
