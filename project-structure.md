# Project Structure

Living map of the monorepo layout. Update when directories or major modules are added or removed.

## Root

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Global coding-agent governance contract |
| `memory-bank/` | Active project context, progress, and reference archives |
| `project-structure.md` | This file — repository layout index |
| `.agents/` | Scoped coding rules and skills |
| `agents/` | Runtime company workflow agents (product features) |
| `docs/` | Architecture proposals, eval traceability, API references |
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

### `services/api/` (platform API)

```
services/api/
├── app/
│   ├── main.py                 # FastAPI entry, CORS, router registration
│   ├── core/
│   │   ├── config.py           # JWT, Resend, and env settings
│   │   ├── security.py         # Password hashing, JWT create/decode
│   │   ├── dependencies.py     # get_current_user, OAuth2PasswordBearer
│   │   ├── email.py            # Resend delivery + dev console fallback for reset links
│   │   └── tinydb.py           # TinyDB connections (suppliers + users)
│   ├── routers/
│   │   ├── auth.py             # login, register, me, change/forgot/reset password
│   │   ├── users.py            # /users CRUD
│   │   ├── suppliers.py        # /api/suppliers/* (protected)
│   │   └── incidents.py        # /api/incidents/* (protected)
│   ├── schemas/
│   │   ├── auth.py             # Login, token schemas
│   │   ├── users.py            # User request/response schemas
│   │   ├── suppliers.py
│   │   └── incidents.py
│   ├── store/
│   │   ├── users_store.py      # User persistence (TinyDB)
│   │   ├── reset_tokens_store.py  # Single-use password reset tokens (TinyDB)
│   │   ├── suppliers_store.py
│   │   └── analysis_store.py
│   └── seed/                   # Supplier idempotent seeding
├── domain/
│   └── incident_analysis.py    # CSV analysis business logic
├── data/                       # TinyDB JSON files (gitignored at runtime)
├── requirements.txt
├── .env.example
└── README.md
```

**Route access (AUTH-01 + AUTH-03):**

- Public: `GET /health`, `POST /users`, `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Protected: all other platform API routes (JWT required)

**Local secrets hygiene:** `services/api/.env`, `uis/backoffice/.env.local`, and `services/api/data/` are gitignored. Commit only `*.env.example` templates.

## `uis/`

| Path | Purpose |
|------|---------|
| `uis/website/` | Public marketing and signup surface |
| `uis/backoffice/` | Internal ops UI (candidates, incidents, suppliers) |

Backoffice calls the platform API via `lib/platform-api-client.ts` (Bearer token + 401 handling). Supplier and incident modules wrap this client. The external tracker API uses `lib/api-client.ts` without platform JWT.

### `uis/backoffice/` auth routes

- Public: `/login`, `/register`, `/forgot-password`, `/reset-password` (`app/(public)/`)
- Protected: `/`, `/candidates/*`, `/suppliers/*`, `/incidents/*`, `/account/*` (`app/(protected)/` + `AuthGuard`)

Key modules: `lib/auth-token.ts`, `services/auth.ts`, `components/auth/*`

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
| `tests/test_incident_analysis.py` | Domain logic unit tests |

## Key documentation

| Path | Purpose |
|------|---------|
| `docs/eval-traceability-auth.md` | AUTH-01 eval evidence matrix |
| `docs/eval-traceability-auth-frontend.md` | AUTH-02 + AUTH-03 eval evidence |
| `docs/eval-traceability-suppliers.md` | Supplier milestone evidence |
| `docs/eval-traceability-incidents.md` | Incident milestone evidence |
| `memory-bank/progress.md` | Delivery status and completed milestones |
| `memory-bank/techContext.md` | Stack, constraints, and architecture patterns |

## Update trigger

Update this file when adding or removing top-level directories, major modules under `services/api`, or primary UI route groups.
