# Docker Platform Implementation Plan

Status: **completed**

## Steps

- [x] Create root `.env.example` with backend + frontend variables
- [x] Add `services/Dockerfile` and `services/.dockerignore`
- [x] Add `uis/Dockerfile`, `uis/start.sh`, and `uis/.dockerignore`
- [x] Add root `docker-compose.yml` with bind mounts and `nexova_network`
- [x] Make CORS origins env-driven in `services/api/app/main.py`
- [x] Align `uis/backoffice/.env.example` and `services/api/.env.example` to port 3001
- [x] Create `docs/eval-traceability-docker.md`
- [x] Update `memory-bank/progress.md` and `project-structure.md`
- [x] Static verification (grep, gitignore, env template); runtime `docker compose up` requires local Docker Desktop

## Notes

- Backend Dockerfile build context is `/services/`; runnable app is `services/api/`.
- UI container runs website on 3000 and backoffice on 3001 via `start.sh`.
- Named volumes preserve container `node_modules` and TinyDB data across bind mounts.
