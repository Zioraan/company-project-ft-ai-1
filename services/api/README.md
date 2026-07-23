# Nexova Platform API

FastAPI service for support ticket CSV analysis, supplier directory, and JWT-authenticated user management.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET_KEY` before running locally.

## Run

From `services/api`:

```bash
uvicorn app.main:app --reload --port 8000
```

The API seeds supplier data idempotently on startup. To run seeding manually:

```bash
cd services/api
python -m app.seed
```

Manual seed output prints `inserted` and `skipped` counts.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET_KEY` | *(required)* | HMAC secret for signing access tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT lifetime in minutes |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `SUPPLIERS_DB_PATH` | `services/api/data/suppliers.json` | Override TinyDB file location for suppliers |
| `USERS_DB_PATH` | `services/api/data/users.json` | Override TinyDB file location for users |
| `PASSWORD_RESET_EXPIRE_MINUTES` | `30` | Reset token lifetime |
| `PASSWORD_RESET_BASE_URL` | `http://localhost:3000/reset-password` | Frontend reset page base URL |
| `RESEND_API_KEY` | *(optional)* | Resend API key for reset emails |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Sender address for reset emails |
| `NEXT_PUBLIC_INCIDENTS_API_URL` | `http://localhost:8000` | Backoffice client base URL for platform API |

## Authentication

Stateless JWT authentication protects supplier and incident routes. Public routes:

- `POST /users` — register a user (no token returned)
- `POST /auth/login` — obtain an access token
- `POST /auth/register` — register and receive a token immediately
- `POST /auth/forgot-password` — request password reset email (always returns generic message)
- `POST /auth/reset-password` — reset password with token
- `GET /health` — health check

All other routes require `Authorization: Bearer <access_token>`.

### Auth endpoints

- `POST /auth/login` — validate credentials and return JWT
- `POST /auth/register` — create user and return JWT
- `GET /auth/me` — current authenticated user profile
- `POST /auth/change-password` — change password (requires current password)
- `POST /auth/forgot-password` — send reset link if account exists
- `POST /auth/reset-password` — set new password from reset token

### User endpoints

- `POST /users` — create user (public)
- `GET /users` — list users (protected)
- `GET /users/{id}` — get user (protected)
- `PUT /users/{id}` — update own profile only (protected; `403` for other users)
- `DELETE /users/{id}` — delete own account only (protected; `403` for other users)

### Testing in `/docs`

1. Call `POST /auth/register` with `email` and `password` (min 8 characters).
2. Copy `access_token` from the response.
3. Click **Authorize**, enter `Bearer <token>` (or paste token if the UI adds the prefix).
4. Call protected routes such as `GET /auth/me` or `GET /api/suppliers`.

## Endpoints

### Incidents (protected)

- `POST /api/incidents/analyze` — upload a CSV (`multipart/form-data`, field `file`)
- `GET /api/incidents/results/export` — download the last analysis as CSV

### Suppliers (protected)

- `POST /api/suppliers` — create a supplier
- `GET /api/suppliers` — list suppliers (`?country=`, `?category=` filters)
- `GET /api/suppliers/{id}` — supplier detail
- `PATCH /api/suppliers/{id}/rate` — update monthly rate
- `PATCH /api/suppliers/{id}/status` — update active/suspended status
- `DELETE /api/suppliers/{id}` — delete supplier

### Health

- `GET /health` — health check (public)

## Frontend note

Backoffice (`uis/backoffice`) stores JWTs in `localStorage`, guards protected routes with `AuthGuard`, and sends Bearer tokens via `platform-api-client.ts`. Set `PASSWORD_RESET_BASE_URL` to match `NEXT_PUBLIC_APP_URL` in the backoffice environment.

## Secrets and local data

Never commit these paths (covered by root `.gitignore`):

- `services/api/.env` — JWT secret, Resend API key, and other runtime secrets
- `uis/backoffice/.env.local` — client env overrides
- `services/api/data/` — TinyDB JSON (user password hashes, reset tokens, supplier records)

Use `services/api/.env.example` and `uis/backoffice/.env.example` as templates only. If a third-party API key was ever stored locally, rotate it in the provider dashboard.

Without `RESEND_API_KEY`, forgot-password still returns a generic success response; the reset URL is printed to the API process stdout for local testing.
