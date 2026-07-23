# Project Structure

Living map of the monorepo layout. Update when directories or major modules are added or removed.

## Root

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Global coding-agent governance contract |
| `.env.example` | Docker Compose env template (copy to `.env` at root) |
| `docker-compose.yml` | UI + backend dev stack with bind mounts |
| `memory-bank/` | Active project context, progress, and reference archives |
| `project-structure.md` | This file — repository layout index |
| `.agents/` | Scoped coding rules and skills |
| `agents/` | Runtime company workflow agents (product features) |
| `docs/` | Architecture proposals, eval traceability, API references |
| `data/pipelines/` | Pipeline design/orchestration workspace (Prefect deliverables planned) |
| `services/` | Shared service contracts and platform API |
| `uis/` | Target UI surfaces (`website`, `backoffice`) |
| `apps/` | Legacy tracker app (deprecated for net-new work) |
| `tests/` | Root Python and TypeScript tests |
| `src/` | Root TypeScript business logic and sample data |

## `services/`

| Path | Purpose |
|------|---------|
| `services/contracts/` | Shared TypeScript request/response contracts (records, notes) |
| `services/domain/` | Business-oriented TypeScript service façades |
| `services/api/` | FastAPI platform API (Python) |
| `services/reporting/` | Reporting boundary helpers for weekly office/programme KPIs |
| `services/Dockerfile` | Backend image (build context `/services`, app in `api/`) |
| `services/.dockerignore` | Backend Docker build exclusions |

### `services/api/` (platform API)

```
services/api/
├── app/
│   ├── main.py                 # FastAPI entry, CORS, router registration
│   ├── core/
│   │   ├── config.py           # JWT, Resend, DATABASE_URL, and env settings
│   │   ├── security.py         # Password hashing, JWT create/decode
│   │   ├── dependencies.py     # get_current_user, OAuth2PasswordBearer
│   │   ├── database.py         # SQLModel engine, get_db, create_all + ensure_inventory_schema
│   │   ├── email.py            # Resend delivery + dev console fallback for reset links
│   │   ├── exceptions.py       # Global HTTP/validation/unhandled handlers
│   │   └── tinydb.py           # TinyDB connections (suppliers + users)
│   ├── models/
│   │   ├── inventory.py        # Asset, AssetEntry, AssetExit SQLModel tables
│   │   ├── telemetry.py        # telemetry_events (immutable ingest storage)
│   │   ├── reporting.py        # weekly_office_program_performance
│   │   └── pipeline_runs.py    # telemetry_pipeline_runs
│   ├── routers/
│   │   ├── auth.py             # login, register, me, change/forgot/reset password
│   │   ├── users.py            # /users CRUD
│   │   ├── suppliers.py        # /api/suppliers/* (protected)
│   │   ├── incidents.py        # /api/incidents/* (protected)
│   │   ├── inventory.py        # /inventory/* (protected, SQLModel)
│   │   ├── telemetry.py        # POST /telemetry/events (public bulk ingest)
│   │   └── reporting.py        # /reporting/* weekly KPIs + pipeline runs (JWT)
│   ├── schemas/
│   │   ├── auth.py             # Login, token schemas
│   │   ├── users.py            # User request/response schemas
│   │   ├── suppliers.py
│   │   ├── incidents.py
│   │   ├── inventory.py        # Asset/order request/response schemas
│   │   ├── telemetry.py        # TelemetryEvent envelope + batch response
│   │   └── reporting.py        # Weekly performance + pipeline-run schemas
│   ├── store/
│   │   ├── users_store.py      # User persistence (TinyDB)
│   │   ├── reset_tokens_store.py  # Single-use password reset tokens (TinyDB)
│   │   ├── suppliers_store.py
│   │   ├── inventory_store.py  # Inventory CRUD + stock computation (SQLModel)
│   │   ├── telemetry_store.py  # Telemetry bulk insert (immutable)
│   │   ├── reporting_store.py  # Weekly KPI upsert/read
│   │   ├── pipeline_runs_store.py
│   │   └── analysis_store.py
│   └── seed/                   # Supplier + inventory idempotent seeding
├── domain/
│   ├── incident_analysis.py    # CSV analysis business logic
│   ├── telemetry_analysis.py   # Legacy request-time telemetry report KPIs
│   └── weekly_office_program_performance.py  # Weekly material KPI aggregation
├── data/                       # TinyDB JSON files (gitignored at runtime)
├── requirements.txt
├── .env.example
└── README.md
```

**Route access (AUTH-01 + AUTH-03):**

- Public: `GET /health`, `POST /users`, `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /telemetry/events`, `GET /telemetry/report`
- Protected: all other platform API routes including `/reporting/*` (JWT required)

**Local secrets hygiene:** `services/api/.env`, `uis/backoffice/.env.local`, and `services/api/data/` are gitignored. Commit only `*.env.example` templates.

## `uis/`

| Path | Purpose |
|------|---------|
| `uis/website/` | Public marketing and signup surface |
| `uis/backoffice/` | Internal ops UI (candidates, incidents, suppliers, inventory) |
| `uis/Dockerfile` | UI image (dual Next.js dev servers) |
| `uis/start.sh` | Starts website `:3000` and backoffice `:3001` |
| `uis/.dockerignore` | UI Docker build exclusions |

Compose `ui` volumes: `./uis/website` → `/app/website`, `./uis/backoffice` → `/app/backoffice`, `./services` → `/services`, `./src` → `/src` (paths match backoffice `../../../services` and `../../../src` imports).

Backoffice calls the platform API via `lib/platform-api-client.ts` (Bearer token + 401 handling). Supplier, incident, and inventory modules wrap this client. The external tracker API uses `lib/api-client.ts` without platform JWT.

### `uis/backoffice/` auth routes

- Public: `/login`, `/register`, `/forgot-password`, `/reset-password` (`app/(public)/`)
- Protected: `/`, `/candidates/*`, `/suppliers/*`, `/inventory/*`, `/incidents/*`, `/account/*` (`app/(protected)/` + `AuthGuard`)

Key modules: `lib/auth-token.ts`, `services/auth.ts`, `components/auth/*`, `services/telemetry.ts`, `lib/telemetry-normalize.ts`

## `tests/`

| Path | Purpose |
|------|---------|
| `tests/conftest.py` | Shared pytest fixtures (auth env, `auth_headers`) |
| `tests/test_auth_api.py` | AUTH-01 eval coverage |
| `tests/test_password_reset_api.py` | AUTH-03 backend eval coverage |
| `tests/auth-token.test.ts` | localStorage token utilities |
| `tests/platform-api-client.test.ts` | Bearer header + 401 session clear |
| `tests/test_suppliers_api.py` | Supplier API regression (authenticated) |
| `tests/test_incidents_api.py` | Incident API regression (authenticated) |
| `tests/test_inventory_api.py` | Inventory API regression (SQLModel + auth) |
| `tests/test_telemetry_api.py` | Telemetry ingest + storage |
| `tests/test_telemetry_report.py` | Telemetry report metrics + cache |
| `tests/telemetry.test.ts` | TelemetryService + normalize helpers |
| `tests/test_weekly_office_program_performance.py` | Weekly KPI aggregation unit tests |
| `tests/test_reporting_api.py` | Reporting weekly performance API |
| `tests/test_pipeline.py` | Prefect pipeline CLI + run endpoints |
| `tests/test_incident_analysis.py` | Domain logic unit tests |
| `tests/inventory-mappers.test.ts` | Inventory label/stock mapper tests |

## Key documentation

| Path | Purpose |
|------|---------|
| `docs/eval-traceability-auth.md` | AUTH-01 eval evidence matrix |
| `docs/eval-traceability-auth-frontend.md` | AUTH-02 + AUTH-03 eval evidence |
| `docs/eval-traceability-suppliers.md` | Supplier milestone evidence |
| `docs/eval-traceability-incidents.md` | Incident milestone evidence |
| `docs/eval-traceability-inventory.md` | Inventory ORM + Supabase milestone evidence |
| `docs/eval-traceability-docker.md` | Docker platform containerization evidence |
| `docs/eval-traceability-telemetry.md` | Telemetry Capture + Storage + Report evidence |
| `docs/telemetry/` | Telemetry plan + event schemas |
| `memory-bank/progress.md` | Delivery status and completed milestones |
| `memory-bank/techContext.md` | Stack, constraints, and architecture patterns |
| `memory-bank/documentation/PIPELINE_IMPLEMENTATION_BRIEF.md` | Full pipeline project brief (phases 1 / 1A / 2 / 3) |
| `memory-bank/documentation/data-pipeline-CONTEXT.md` | Weekly Office & Programme Performance business context |
| `memory-bank/documentation/telemetry-CONTEXT.md` | Mandatory material telemetry metrics context |
| `memory-bank/documentation/pipeline-phase-1-implementation-plan.md` | Phase 1 planning verification plan (archived under past-implementations) |
| `memory-bank/documentation/pipeline-phase-1a-implementation-plan.md` | Phase 1A plan (archived) |
| `memory-bank/documentation/pipeline-phase-2-implementation-plan.md` | Phase 2 plan (archived) |
| `memory-bank/documentation/pipeline-phase-3-implementation-plan.md` | Phase 3 plan (archived) |
| `data/pipelines/PIPELINE_DESIGN.md` | Weekly performance Prefect pipeline design |
| `data/pipelines/pipeline.py` | Prefect flow/tasks CLI entrypoint |

## Update trigger

Update this file when adding or removing top-level directories, major modules under `services/api`, or primary UI route groups.
