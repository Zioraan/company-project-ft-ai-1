"""FastAPI entrypoint for Nexova platform API."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import clear_settings_cache, get_settings
from app.routers.auth import router as auth_router
from app.routers.incidents import router as incidents_router
from app.routers.suppliers import router as suppliers_router
from app.routers.users import router as users_router
from app.seed.suppliers_seed import SUPPLIERS_SEED
from app.store.suppliers_store import seed_suppliers


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s:     %(message)s",
    )
    clear_settings_cache()
    get_settings()
    seed_suppliers(SUPPLIERS_SEED)
    yield


app = FastAPI(
    title="Nexova Platform API",
    description="Support ticket analysis and supplier directory services",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(incidents_router)
app.include_router(suppliers_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
