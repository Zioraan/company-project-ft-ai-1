# Inventory Management Workspace Context

This document is a workspace translation aid for the implementation agent. It is not an implementation plan. Its job is to map the inventory milestone requirements and eval criteria onto the monorepo structure that already exists in this repository.

## Canonical Inputs

Use these sources together:

1. `memory-bank/documentation/backend-inventory-management-CONTEXT.md`
2. The backend eval screenshots
3. The frontend eval screenshots
4. Root governance in `AGENTS.md` and `.agents/rules/*`

When the screenshots use generic milestone names that conflict with Nexova's company-specific context, the company context wins for entity and field naming. In this repo, that means:

| Generic eval wording | Nexova context wording |
| --- | --- |
| `Product` | `Asset` |
| `InboundOrder` | `AssetEntry` |
| `OutboundOrder` | `AssetExit` |
| `user_uid` | `user_uuid` |

The route shape from the eval still matters: the API surface is under `/inventory`, with `/inventory/products` and `/inventory/orders/*`.

## Current Backend Shape

The active FastAPI service lives under `services/api/app/`, not under a flat `services/` layout.

- `services/api/app/main.py`
  Registers routers directly with `app.include_router(...)` and seeds startup data inside the FastAPI lifespan hook.
- `services/api/app/routers/`
  Current feature routers are `auth.py`, `incidents.py`, `suppliers.py`, and `users.py`.
- `services/api/app/schemas/`
  Pydantic schemas are already split into feature modules such as `suppliers.py` and `users.py`.
- `services/api/app/store/`
  Current persistence for implemented business features is TinyDB-backed.
- `services/api/app/core/tinydb.py`
  Centralizes TinyDB connections for suppliers and users and exposes reset helpers for tests.
- `services/api/app/core/dependencies.py`
  `get_current_user()` is the existing auth dependency for protected routes.
- `tests/conftest.py`
  Root-level pytest fixtures register a test user and provide authenticated Bearer headers.

Important backend reality today:

- There is no existing inventory router.
- There is no existing SQLModel layer.
- There is no shared SQL session dependency yet.
- There is no `services/api/app/api/v1/router.py`.
- There is no current `database.py` module.
- `services/api/requirements.txt` does not currently include `sqlmodel` or a Postgres driver.
- `services/api/.env.example` currently covers JWT, TinyDB path overrides, and password-reset settings only.

## Backend Translation Notes

The eval examples mention files like `database.py`, `models.py`, `schemas.py`, and `routers/inventory.py`. In this repo, those ideas need to be interpreted through the current `services/api/app` package structure rather than copied literally from a generic milestone skeleton.

What already aligns with the eval:

- Protected business routers already use `Depends(get_current_user)` at the router level.
- Pydantic request/response schemas are already separate from persistence code.
- Startup work already happens in `app.main.lifespan`.
- Authenticated user identity already comes from TinyDB-backed auth and JWT.

What is new for this milestone:

- Inventory is the first feature that must add a second persistence system while leaving TinyDB in place for auth and user lookup.
- Inventory is the first feature that must introduce ORM models that are structurally different from response schemas.
- Inventory is the first feature that must compute a stock field from related order data instead of storing it directly.

How this maps into the current backend:

- The inventory router belongs under `services/api/app/routers/` and should be registered from `services/api/app/main.py`.
- The authenticated creator field must come from the existing auth dependency. The current authenticated user object exposes `id`; that value is the available source for Nexova's `user_uuid` field.
- If the implementation introduces SQLModel-specific modules, that will be a new pattern for this repo rather than an extension of an existing ORM package.
- Inventory startup initialization should be wired into the same FastAPI lifespan flow that currently seeds suppliers.
- API tests in this repo live in the root `tests/` directory, so inventory backend coverage should be expected there rather than inside `services/api/tests/`.

## Current Frontend Shape

The active backoffice UI lives in `uis/backoffice`.

- Protected pages live under `uis/backoffice/app/(protected)/`.
- `uis/backoffice/app/(protected)/layout.tsx` applies `UnauthorizedHandlerProvider`, `AuthGuard`, and `BackofficeNav` to all protected routes.
- `uis/backoffice/components/auth/AuthGuard.tsx` handles redirect-to-login behavior for unauthenticated users.
- `uis/backoffice/lib/platform-api-client.ts` is the shared request layer. It reads the JWT from `localStorage`, adds the `Authorization: Bearer <token>` header for protected calls, and normalizes API error messages.
- Domain service modules live under `uis/backoffice/services/`.
- Domain hooks live under `uis/backoffice/hooks/`.
- Types live under `uis/backoffice/types/`.
- `uis/backoffice/components/navigation/BackofficeNav.tsx` contains the protected navigation links that currently expose Dashboard, Talent Pipeline, Supplier Directory, Incident Analysis, and Account.

Important frontend reality today:

- There is no inventory UI yet.
- There is no `services/inventory.ts`.
- There is no inventory-specific type module.
- There are no inventory routes under `app/(protected)/inventory/`.
- The current shared API base env var is still named `NEXT_PUBLIC_INCIDENTS_API_URL`, but it is used as the general platform API base URL by `platform-api-client.ts`.
- The backoffice app's protected routes are rooted at `/`, `/suppliers`, `/candidates`, etc. There is no literal `/backoffice/...` URL prefix inside this app.

## Frontend Translation Notes

The eval screenshots describe pages like `/backoffice/inventory/products`. In this repo, the equivalent implementation target is the protected route group under `uis/backoffice/app/(protected)/inventory/...`, which would resolve to `/inventory/...` within the backoffice app.

What already aligns with the eval:

- Protected route enforcement is already centralized through the protected layout and auth guard.
- The shared API client already attaches bearer tokens.
- The shared API client already surfaces parsed 4xx/5xx errors instead of swallowing them.
- Existing feature modules already follow the required service-boundary rule: components do not fetch directly.

Closest frontend references in the current codebase:

- Supplier directory for list, detail, service, hook, and protected-page patterns.
- Incident analysis for form submission and visible error handling around API responses.

How inventory maps into the current frontend:

- Inventory API access should be introduced through the existing service layer pattern under `uis/backoffice/services/`.
- Inventory pages belong in the protected App Router tree under `uis/backoffice/app/(protected)/inventory/`.
- Inventory types belong with the existing feature type modules under `uis/backoffice/types/`.
- If a domain-specific API wrapper is added, it should still sit on top of `platform-api-client.ts`, not bypass it.
- Navigation discoverability will require updating `BackofficeNav.tsx`, because inventory links do not exist today.

Frontend behavior the implementation must account for in this repo:

- Product selection in forms should display human-readable asset names, not raw IDs.
- Orders history needs explicit inbound/outbound labeling in the UI rather than exposing raw transport values unformatted.
- The outbound form's stock warning and API `400` insufficient-stock message both need visible UI treatment.
- The products page needs a visual stock-status treatment, but no reusable stock indicator component exists yet.

## Structural Gaps Between Workspace and Eval

Backend gaps:

- Missing SQLModel/Postgres dependency chain and env configuration.
- Missing dual-database bootstrap: TinyDB for auth plus SQLModel session for inventory.
- Missing inventory router, schemas, models, and stock-computation logic.
- Missing inventory startup seed/init path.
- Missing inventory pytest coverage in the root `tests/` suite.

Frontend gaps:

- Missing inventory routes and navigation.
- Missing inventory service module and types.
- Missing inventory list/order UI components.
- Missing client-side stock warning UX for outbound orders.
- Missing read-only orders history page and supporting data flow.

## Repo-Specific Guardrails For The Next Agent

- Keep using the existing FastAPI auth dependency and TinyDB users; do not invent a SQL user table for inventory.
- Keep API access behind `platform-api-client.ts` or a thin domain wrapper over it; do not fetch inside React components.
- Preserve visible loading and error states for every new async route or form.
- Follow Nexova's inventory context names and fields when generic eval wording conflicts with company-specific wording.
- Treat this milestone as an extension of the current monorepo layout, not as a greenfield copy of a generic milestone scaffold.
