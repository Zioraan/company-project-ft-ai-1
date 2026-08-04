# Technical Context

## Current Stack

- TypeScript at root for logic layer and tests.
- Vitest for unit testing root business logic.
- Next.js (App Router), React, Tailwind in talent pipeline tracker app.
- SWR in `uis/backoffice` for client-side cache/dedup and hydration-aware data fetching.
- FastAPI platform API at `services/api` with pytest coverage in `tests/`.
- TinyDB JSON persistence for suppliers and users (`services/api/data/`).
- JWT auth: `python-jose`, `passlib[bcrypt]`, `python-dotenv`, `email-validator`.
- Root `uv` / `pyproject.toml` for host-side ML scripts (sales forecast: scikit-learn, scipy, matplotlib, seaborn, statsmodels). Not installed in the Compose API image.

## Existing Architecture Patterns Worth Preserving

- Service boundary for API operations.
- Shared API client with normalized error handling.
- Mapper boundary for API enum to UI label translation.
- Query-state sync with URL params in list/filter UX.
- FastAPI router → schema → store layering in `services/api`.
- Centralized auth via `get_current_user` dependency on protected platform routes.

## Known Constraints

1. `CONTEXT.md` is mandatory business context for all sessions.
2. Historical milestone contexts are reference-only unless explicitly requested.
3. Coding governance lives in root `AGENTS.md` and `.agents/*`.
4. Runtime company agents are separated under `agents/`.
5. Platform API (`services/api`) requires `JWT_SECRET_KEY` at startup; passwords must never be stored in plain text.
6. Protected platform routes expect `Authorization: Bearer <token>`; backoffice attaches tokens via `platform-api-client.ts`.
7. `/candidates` is session-gated in backoffice but still uses the external tracker API without platform JWT.

## Planned Structural Direction

- Target product structure includes `uis/website` and `uis/backoffice`.
- Root `services` will host shared business/API integration contracts.
- Migration should be staged with parity checkpoints, not a one-shot rewrite.

## Current Migration Snapshot

- Stage 2 cutover policy is documented; legacy `apps/*` paths are deprecated for net-new work.
- Stage 3 service extraction has started with shared root adapters for records and notes.
- Backoffice hooks (`useCandidates`, `useCandidateDetail`, `useNotes`) are now SWR-backed with server-prefetch fallback data support.
- Stage 4 sunset criteria are explicitly documented to govern eventual legacy path removal/freeze.
- AUTH-01 delivered on `feature/auth`: `/auth` and `/users` modules live; `/api/suppliers/*` and `/api/incidents/*` are JWT-protected.
- AUTH-02 + AUTH-03 delivered: backoffice login/register/account/reset flows; platform API change-password and Resend-backed forgot/reset endpoints.

## Platform API Auth Surface

Public routes:

- `POST /users`, `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /health`, `POST /telemetry/events`, `GET /telemetry/report`

Protected routes (require valid JWT):

- `GET /auth/me`, `POST /auth/change-password`, `GET/PUT/DELETE /users/*` (mutations self-only)
- All `/api/suppliers/*` and `/api/incidents/*`
- `/inventory/*`
- `/reporting/*` (weekly office/programme performance + pipeline runs)

Backoffice public UI routes (no `AuthGuard`):

- `/login`, `/register`, `/forgot-password`, `/reset-password`

Configuration (via `services/api/.env`, gitignored):

- `JWT_SECRET_KEY` (required)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default `30`)
- `PASSWORD_RESET_EXPIRE_MINUTES`, `PASSWORD_RESET_BASE_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (optional in dev; unset key logs reset URL to API console)
- `USERS_DB_PATH`, `SUPPLIERS_DB_PATH` (optional TinyDB overrides; default under `services/api/data/`, also gitignored)

Backoffice client env (`uis/backoffice/.env.local`, gitignored): `NEXT_PUBLIC_INCIDENTS_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TELEMETRY_ENDPOINT`.

## Engineering Rule Anchors

- Never render raw API status/stage enums in UI.
- No direct fetch calls in UI components.
- Always expose async loading and failure states.
- Keep shared contracts centralized to avoid drift across surfaces.

## Verification Baseline

- Lint, typecheck, and tests are required before commit.
- Governance and memory updates are required when architecture/workflow changes.

## Tooling Notes

- `next dev` can auto-update app-level `tsconfig.json` settings (for example `jsx` and dev type includes). Treat these changes as explicit review items.
- Next.js warns about multiple lockfiles in this monorepo layout; warnings are non-blocking but should be tracked for noise reduction.

## Update Trigger

Update this file whenever stack decisions, architecture boundaries, or hard constraints change.
