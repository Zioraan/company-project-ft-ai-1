# Docker Platform Workspace Context

This document is a handoff context file for the next implementation agent. It combines the Docker milestone eval requirements with the current monorepo structure so the Docker setup can be implemented against the repo as it exists now.

This is not an implementation plan. It is a repo-aware translation of the requirements and success criteria.

## Canonical Inputs

Use these sources together:

1. Root `AGENTS.md`
2. `memory-bank/projectbrief.md`
3. `memory-bank/techContext.md`
4. `memory-bank/progress.md`
5. This Docker context file
6. The attached Docker eval screenshots

## Current Workspace Snapshot

The workspace has moved beyond the earlier auth-only shape. Relevant current structure:

- `uis/website`
  Public Next.js app
- `uis/backoffice`
  Protected operations Next.js app with JWT auth, SWR hooks, inventory UI, supplier UI, and incident analysis UI
- `services/api`
  FastAPI platform API
- `services/api/app/core/database.py`
  SQLModel engine and `get_db()` session dependency for inventory persistence
- `services/api/app/core/tinydb.py`
  TinyDB persistence for users, suppliers, and auth-related data
- `services/api/app/main.py`
  FastAPI entrypoint and startup seeding
- `services/api/app/routers/`
  `auth.py`, `users.py`, `suppliers.py`, `incidents.py`, `inventory.py`
- `services/api/.env.example`
  Current backend env template, now including `DATABASE_URL`
- `uis/backoffice/.env.example`
  Current backoffice env template
- Root `.gitignore`
  Already ignores `.env*` with `!**/.env.example`

Current milestone state that matters for Docker:

- Inventory has already been implemented.
- The backend now uses dual persistence:
  - TinyDB for auth/users/suppliers support
  - SQLModel plus PostgreSQL via `DATABASE_URL` for inventory
- The backoffice now includes inventory routes:
  - `/inventory/products`
  - `/inventory/orders`
  - `/inventory/orders/inbound`
  - `/inventory/orders/outbound`
- The website and backoffice are separate Next.js apps and each has its own `package.json`.

## Important Repo Reality Before Dockerization

There are currently no Docker artifacts in the repo:

- no root `docker-compose.yml`
- no `uis/Dockerfile`
- no `services/Dockerfile`
- no `uis/.dockerignore`
- no `services/.dockerignore`
- no `uis/start.sh`

There is also no root `.env.example` yet that centralizes all Docker-runtime variables across the stack.

## Eval Requirements

### What You Need To Do

#### UI Dockerfile (`/uis/Dockerfile`)

- Create a Dockerfile in `/uis/` based on an official Node Alpine image.
- It must install dependencies for `/uis/website` and `/uis/backoffice` separately.
- The default `CMD` must invoke a `start.sh` script.
- `start.sh` must start both Next.js apps inside one container:
  - website on port `3000`
  - backoffice on port `3001`
- Create `/uis/.dockerignore` excluding at minimum:
  - `node_modules`
  - `.next`
  - `.env*`
  - `*.log`

#### Backend Dockerfile (`/services/Dockerfile`)

- Create a Dockerfile in `/services/` based on an official Python image.
- It must install dependencies from `requirements.txt`.
- It must start the Uvicorn server with `--reload` enabled.
- Create `/services/.dockerignore` excluding at minimum:
  - `__pycache__`
  - `*.pyc`
  - `.env*`
  - `tests/`
  - `*.log`

#### Docker Compose (`docker-compose.yml`)

- Create `docker-compose.yml` at the repository root.
- Define two services:
  - UI service built from `/uis/`
  - backend service built from `/services/`
- Both services must use bind mounts so source changes on the host reflect without rebuilding images.
- The UI service must run both Next dev servers.
- The backend service must run Uvicorn with `--reload`.
- Expose the correct ports so services are reachable from the host.
- Connect both services to an explicitly named Docker network.
- Verify that inter-service URLs use the service name as the host rather than `localhost`.

#### Secrets and environment variables

- Never hardcode secrets, API keys, or passwords in Dockerfiles or `docker-compose.yml`.
- Define environment variables via a root `.env` file instead of hardcoding them in YAML.
- Confirm that `.env` is in the repository `.gitignore`.

### What We Will Evaluate

- `docker compose up` from the repository root starts the full platform without errors and without extra manual setup.
- Host code changes are reflected without rebuilding images.
- The UI container starts both Next.js apps on ports `3000` and `3001`.
- Services communicate internally by Docker service name, not by `localhost` or hardcoded IP.
- No secrets, API keys, or passwords are hardcoded in any Dockerfile or in `docker-compose.yml`.
- `.env` is in `.gitignore` and is not committed.
- `.dockerignore` files exist in both `/uis/` and `/services/`.

## Repo-Specific Translation Notes

The eval wording is slightly more generic than the current monorepo structure. The next agent should translate it this way:

### UI build context translation

The eval’s `/uis/Dockerfile` matches the repo directly.

What the container needs to account for:

- `uis/website/package.json` exists and has its own `dev` script.
- `uis/backoffice/package.json` exists and has its own `dev` script.
- Both apps currently have local `node_modules` and `.next` directories in the workspace, so the UI `.dockerignore` needs to exclude those to avoid a noisy and slow build context.
- There is no existing `start.sh`, so the UI container will need a new script as the command entrypoint.

### Backend build context translation

The eval says `/services/Dockerfile` should install from `requirements.txt`, but the actual Python dependency file is currently at:

- `services/api/requirements.txt`

The actual FastAPI application entrypoint is also nested:

- `services/api/app/main.py`
- Uvicorn import target is `app.main:app` when the working directory is `services/api`

That means the backend Docker implementation must reconcile the eval’s `/services/` build context with the repo’s actual backend root under `/services/api`.

This is a structural translation point, not a contradiction:

- the Dockerfile lives in `/services/`
- the runnable app and requirements still live in `/services/api`

### Current backend runtime facts

The backend now requires more than just JWT configuration:

- `JWT_SECRET_KEY` is required
- `DATABASE_URL` is required
- password reset settings are used by auth flows
- TinyDB data files default under `services/api/data/`

Startup behavior already includes:

- supplier seeding
- inventory table initialization
- inventory seed loading

This matters because `docker compose up` is expected to work from a clean start without extra manual bootstrapping beyond the required env file.

### Current frontend runtime facts

The backoffice client currently reads its platform API base URL from:

- `NEXT_PUBLIC_INCIDENTS_API_URL`

The name is legacy, but it is the active platform API base URL for the backoffice.

The backoffice also uses:

- `NEXT_PUBLIC_APP_URL`

That matters for auth/password-reset behavior and host-facing route generation.

The website app does not currently have a committed env template and appears to be mostly static at this stage.

## Docker Networking Nuance In This Repo

This repo has one subtle but important Docker concern:

- The eval expects inter-service communication by Docker service name rather than `localhost`.
- The backoffice API client is browser-facing and currently defaults to `http://localhost:8000`.

That creates a distinction the next agent must respect:

- container-to-container traffic can use Docker service names
- browser-to-container traffic from the host browser cannot blindly use a Docker service name unless the request is proxied through the Next server or otherwise made resolvable from the browser context

Because some backoffice pages already fetch inventory and other data through shared service modules and client-side API calls, the Docker setup must be evaluated against how `NEXT_PUBLIC_*` values are consumed in the browser, not only how containers see each other internally.

This is the main repo-specific integration risk for the Docker milestone.

## Current File And Process Boundaries To Preserve

Preserve these existing architecture rules while implementing Docker:

- No direct fetch calls in UI components.
- Shared API access continues through `uis/backoffice/lib/platform-api-client.ts` and feature wrappers built on top of it.
- FastAPI remains the single backend surface under `services/api`.
- Secrets remain env-driven, not committed to source.
- Existing auth and inventory behavior should remain usable after containerization.

## Concrete Gaps Between Current Repo And Docker Eval

Missing today:

- root `docker-compose.yml`
- `uis/Dockerfile`
- `uis/start.sh`
- `uis/.dockerignore`
- `services/Dockerfile`
- `services/.dockerignore`
- Docker-oriented root env documentation or template
- Docker-specific host and service URL wiring

Potentially fragile points during implementation:

- mapping `/services/Dockerfile` to the real backend app under `/services/api`
- ensuring both Next dev servers start and remain alive in one UI container
- reconciling service-name networking with browser-facing `NEXT_PUBLIC_INCIDENTS_API_URL`
- updating host-facing app URLs so password-reset and backoffice routing still point to the correct exposed port
- making bind mounts work without breaking container-installed dependencies

## Repo-Specific Guidance For The Next Agent

- Treat this as a monorepo containerization task, not a single-app Docker setup.
- Anchor all backend runtime assumptions on `services/api`, even if the Dockerfile itself lives in `/services`.
- Remember that inventory made `DATABASE_URL` mandatory, so Docker boot must supply it through env configuration.
- Do not hardcode any real secret or Supabase credential in Docker artifacts.
- Use the existing root `.gitignore` behavior as evidence that `.env` is already intended to stay untracked.
- Verify Docker decisions against the actual backoffice/browser request path, not only against container internals.
