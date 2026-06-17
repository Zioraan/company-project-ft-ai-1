# Nexova Platform API

FastAPI service for support ticket CSV analysis and the supplier directory.

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

The API seeds supplier data idempotently on startup. To run seeding manually:

```bash
cd services/api
python -m app.seed
```

Manual seed output prints `inserted` and `skipped` counts.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `SUPPLIERS_DB_PATH` | `services/api/data/suppliers.json` | Override TinyDB file location (tests, isolation) |
| `NEXT_PUBLIC_INCIDENTS_API_URL` | `http://localhost:8000` | Backoffice client base URL for incidents and suppliers |

## Endpoints

### Incidents

- `POST /api/incidents/analyze` — upload a CSV (`multipart/form-data`, field `file`)
- `GET /api/incidents/results/export` — download the last analysis as CSV

### Suppliers

- `POST /api/suppliers` — create a supplier
- `GET /api/suppliers` — list suppliers (`?country=`, `?category=` filters)
- `GET /api/suppliers/{id}` — supplier detail
- `PATCH /api/suppliers/{id}/rate` — update monthly rate
- `PATCH /api/suppliers/{id}/status` — update active/suspended status
- `DELETE /api/suppliers/{id}` — delete supplier

### Health

- `GET /health` — health check
