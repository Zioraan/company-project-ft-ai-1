# Nexova Incidents API

FastAPI service for support ticket CSV analysis.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

From `services/api`:

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `POST /api/incidents/analyze` — upload a CSV (`multipart/form-data`, field `file`)
- `GET /api/incidents/results/export` — download the last analysis as CSV
- `GET /health` — health check
