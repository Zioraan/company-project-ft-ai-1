"""FastAPI entrypoint for Nexova platform API."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import clear_settings_cache, get_settings
from app.core.database import get_engine, init_inventory_db
from app.core.exceptions import register_exception_handlers
from app.routers.auth import router as auth_router
from app.routers.incidents import router as incidents_router
from app.routers.inventory import router as inventory_router
from app.routers.reporting import router as reporting_router
from app.routers.suppliers import router as suppliers_router
from app.routers.telemetry import router as telemetry_router
from app.routers.users import router as users_router
from app.seed.inventory_seed import INVENTORY_SEED
from app.seed.suppliers_seed import SUPPLIERS_SEED
from app.store import inventory_store
from app.store.suppliers_store import seed_suppliers
from sqlmodel import Session


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s:     %(message)s",
    )
    clear_settings_cache()
    get_settings()
    try:
        seed_suppliers(SUPPLIERS_SEED)
        init_inventory_db()
        with Session(get_engine()) as session:
            inventory_store.seed_inventory(session, INVENTORY_SEED)
    except Exception:
        logging.exception("Failed to seed data during startup")
        raise
    yield


app = FastAPI(
    title="Nexova Platform API",
    description="Support ticket analysis and supplier directory services",
    version="1.0.0",
    lifespan=lifespan,
)

_DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:3001,"
    "http://127.0.0.1:3001"
)


def _parse_cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", _DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(incidents_router)
app.include_router(suppliers_router)
app.include_router(inventory_router)
app.include_router(telemetry_router)
app.include_router(reporting_router)

register_exception_handlers(app)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
