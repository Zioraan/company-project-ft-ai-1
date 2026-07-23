"""Shared pytest fixtures for API tests.

Pipeline tests under ``tests/pipelines/`` skip API fixture setup so they can
run via the root ``uv`` environment without FastAPI installed.
"""

from __future__ import annotations

import os
from pathlib import Path

# Set auth env before test modules import the FastAPI app.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"


def _is_pipeline_test(request: pytest.FixtureRequest) -> bool:
    path = Path(str(request.path))
    return "pipelines" in path.parts


SAMPLE_USER = {
    "email": "test.user@example.com",
    "password": "securepass123",
}


@pytest.fixture(autouse=True)
def auth_env(
    request: pytest.FixtureRequest,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    if _is_pipeline_test(request):
        yield
        return

    import sys

    sys.path.insert(0, str(API_DIR))

    from app.core.config import clear_settings_cache
    from app.core.database import dispose_engine, get_engine, reset_inventory_db
    from app.core.tinydb import reset_db, reset_users_db
    from app.seed.inventory_seed import INVENTORY_SEED
    from app.store import inventory_store
    from sqlmodel import Session

    users_db = tmp_path / "users.json"
    suppliers_db = tmp_path / "suppliers.json"
    inventory_db = tmp_path / "inventory.db"
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-pytest")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("USERS_DB_PATH", str(users_db))
    monkeypatch.setenv("SUPPLIERS_DB_PATH", str(suppliers_db))
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{inventory_db}")
    clear_settings_cache()
    dispose_engine()
    reset_users_db()
    reset_db()
    reset_inventory_db()
    with Session(get_engine()) as session:
        inventory_store.seed_inventory(session, INVENTORY_SEED)
    yield
    clear_settings_cache()
    dispose_engine()
    reset_users_db()
    reset_db()


@pytest.fixture
def client():
    import sys

    from fastapi.testclient import TestClient

    sys.path.insert(0, str(API_DIR))
    from app.main import app

    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def auth_headers(client) -> dict[str, str]:
    response = client.post("/auth/register", json=SAMPLE_USER)
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_auth_headers(client) -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={
            "email": "other.user@example.com",
            "password": "securepass456",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
