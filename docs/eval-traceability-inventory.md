# Inventory Management Eval Traceability Matrix

Maps inventory milestone (ORM + Supabase + backoffice UI) criteria to implementation artifacts and verification methods.

## Scope

- SQLModel ORM on Supabase PostgreSQL (Company-Milestone project `tucrpazizfmtwucngvvu`)
- Dual-database FastAPI layer (TinyDB auth + SQL inventory)
- Backoffice inventory UI (`/inventory/products`, `/inventory/orders/*`)

## Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-I01 | `DATABASE_URL` in env, not hardcoded | `services/api/.env.example`, `app/core/config.py` | Config review | Pass | Required at startup |
| E-I02 | TinyDB + SQLModel connections | `app/core/tinydb.py`, `app/core/database.py` | Architecture review | Pass | Dual persistence |
| E-I03 | `get_db` yields session per request | `app/core/database.py`, `app/routers/inventory.py` | Code review | Pass | No global session |
| E-I04 | ORM models with FK relationships | `app/models/inventory.py` | Schema review | Pass | `asset_entry.asset_id`, `asset_exit.asset_id` |
| E-I05 | `create_all` on startup | `app/core/database.py`, `app/main.py` lifespan | Startup + pytest | Pass | `init_inventory_db()` |
| E-I06 | Pydantic schemas separate from ORM | `app/schemas/inventory.py` | File review | Pass | No raw SQLModel in responses |
| E-I07 | `current_stock` computed, not stored | `app/store/inventory_store.py` | `test_list_products_includes_computed_stock_from_seed` | Pass | Aggregate query |
| E-I08 | Insufficient stock → HTTP 400 before write | `inventory_store.create_asset_exit` | `test_outbound_order_rejects_insufficient_stock` | Pass | Exact CONTEXT message |
| E-I09 | Orders store `user_uuid` from JWT user | `app/routers/inventory.py` | `test_inbound_order_stores_authenticated_user_uuid` | Pass | `current_user.id` |
| E-I10 | `/inventory` router with 6 endpoints | `app/routers/inventory.py` | `test_inventory_api.py` | Pass | All routes JWT-protected |
| E-I11 | Allocation `assigned_to` validation | `app/schemas/inventory.py` | `test_outbound_allocation_requires_assigned_to` | Pass | 422 via Pydantic |
| E-I12 | Idempotent seed data | `app/seed/inventory_seed.py`, `inventory_store.seed_inventory` | `test_repeated_inventory_seed_is_idempotent` | Pass | 6 assets, 4 entries, 3 exits |
| E-I13 | Nexova entity names (Asset, AssetEntry, AssetExit) | Models, schemas, UI types | Review | Pass | API paths remain `/inventory/products` |
| E-I14 | Dedicated inventory API service module | `uis/backoffice/services/inventory.ts` | Lint/review | Pass | No fetch in components |
| E-I15 | Bearer token on protected calls | `lib/inventory-api-client.ts` → `platform-api-client.ts` | Review | Pass | Reuses auth token flow |
| E-I16 | Products page with stock indicators | `app/(protected)/inventory/products`, `StockStatusBadge.tsx` | Build + UI review | Pass | Thresholds in `inventory-mappers.ts` |
| E-I17 | Inbound form with name selector + feedback | `AssetEntryForm.tsx`, `/inventory/orders/inbound` | Build route table | Pass | Success/error visible |
| E-I18 | Outbound reactive stock + client warning | `AssetExitForm.tsx` | UI review | Pass | `getAssetById` on select |
| E-I19 | Orders history read-only with distinction | `OrderHistoryTable.tsx`, `/inventory/orders` | Build route table | Pass | Inbound/outbound badges |
| E-I20 | All inventory pages route-protected | `app/(protected)/layout.tsx`, `AuthGuard` | Route group review | Pass | Inherited from protected layout |
| E-I21 | No raw API enums in UI | `lib/inventory-mappers.ts` | `tests/inventory-mappers.test.ts` | Pass | Label maps for category/type |

## Verification Commands

1. `pip install -r requirements-dev.txt`
2. `pytest tests/test_inventory_api.py`
3. `npm run test -- tests/inventory-mappers.test.ts`
4. `npm run build --prefix uis/backoffice`
5. `npm run ci`

## Open Items

- Production `DATABASE_URL` must be set locally in `services/api/.env` pointing to Supabase Company-Milestone (project ref `tucrpazizfmtwucngvvu`).
