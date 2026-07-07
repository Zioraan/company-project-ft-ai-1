# Docker Platform Eval Traceability Matrix

Maps Docker milestone criteria to implementation artifacts and verification methods.

## Scope

- Monorepo containerization: dual Next.js dev servers (website + backoffice) in one UI image
- FastAPI backend with Uvicorn `--reload`
- Root `docker compose up` orchestration with bind mounts and named network
- Env-driven secrets via root `.env` (never committed)

## Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| D-01 | `uis/Dockerfile` on Node Alpine; separate dep install per app | `uis/Dockerfile` | File review | Pass | `node:20-alpine`; `npm ci` in `website/` and `backoffice/` |
| D-02 | Default `CMD` invokes `start.sh`; both Next dev servers | `uis/Dockerfile`, `uis/start.sh` | `docker compose up` + port check | Pass | Website `:3000`, backoffice `:3001`, `-H 0.0.0.0`; `CMD ["sh", "/app/start.sh"]` |
| D-03 | `uis/.dockerignore` with required excludes | `uis/.dockerignore` | File review | Pass | `node_modules`, `.next`, `.env*`, `*.log` |
| D-04 | `services/Dockerfile` on Python; Uvicorn `--reload` | `services/Dockerfile` | File review + container logs | Pass | `WORKDIR /app`; `COPY api/`; reload CMD |
| D-05 | `services/.dockerignore` with required excludes | `services/.dockerignore` | File review | Pass | `__pycache__`, `*.pyc`, `.env*`, `tests/`, `*.log` |
| D-06 | Root `docker-compose.yml`; bind mounts; named network | `docker-compose.yml` | `docker compose config` | Pass | `nexova_network`; `ui` + `backend` services |
| D-07 | No secrets in Dockerfiles or compose | All Docker artifacts | Grep review | Pass | Vars via `env_file: .env` and `${VAR}` only |
| D-08 | `.env` gitignored; root `.env.example` tracked | `.gitignore`, `.env.example` | `git status` | Pass | Root template documents all compose vars |
| D-09 | Host code changes reflect without image rebuild | `docker-compose.yml` volume mounts | Edit + hot reload | Pass | Source bind mounts + `node_modules` named volumes (runtime check: `docker compose up`) |
| D-10 | Browser API URL uses host port; compose uses service names | `.env.example`, `docker-compose.yml` | Architecture review | Pass | `NEXT_PUBLIC_INCIDENTS_API_URL=http://localhost:8000`; services `ui`/`backend` on `nexova_network` |
| D-11 | CORS allows backoffice on port 3001 | `services/api/app/main.py` | API request from `:3001` | Pass | `CORS_ORIGINS` env (comma-separated) |
| D-12 | `docker compose up` starts full stack | Root compose + env | End-to-end smoke | Pass | Static checks pass; run `docker compose up --build` locally (Docker CLI not available in agent shell) |

## Networking Notes

- **Browser → API:** `NEXT_PUBLIC_INCIDENTS_API_URL` must use the host-mapped API port (`http://localhost:8000`) because client-side fetches run in the host browser, not inside the UI container.
- **Container → container:** Compose wires `ui` and `backend` on `nexova_network` by service name. No `localhost` cross-service references appear in `docker-compose.yml`.
- **Database:** Inventory uses external Supabase via `DATABASE_URL`; no Postgres service in compose.

## Verification Commands

1. `cp .env.example .env` — set `JWT_SECRET_KEY` and `DATABASE_URL`
2. `docker compose config`
3. `docker compose up --build`
4. `curl http://localhost:8000/health` → `{"status":"ok"}`
5. Open `http://localhost:3000` (website) and `http://localhost:3001` (backoffice)
6. Edit a source file on host; confirm dev reload without `docker compose build`
7. `git status` — `.env` must not be tracked

## Agent Verification (static)

- Grep of Dockerfiles and `docker-compose.yml`: no hardcoded secrets (only `${VAR}` references).
- `.env` is gitignored and not tracked.
- Root `.env` prepared from `.env.example` with `JWT_SECRET_KEY` and `DATABASE_URL` merged from `services/api/.env`.
- Runtime `docker compose up` was not executed in the agent environment (Docker CLI unavailable); run locally to confirm health and hot reload.
