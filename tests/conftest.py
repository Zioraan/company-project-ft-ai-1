"""Shared pytest fixtures for API tests."""

from __future__ import annotations

import os

# Set auth env before test modules import the FastAPI app.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from app.core.config import clear_settings_cache  # noqa: E402
from app.core.tinydb import reset_db, reset_users_db  # noqa: E402
from app.main import app  # noqa: E402

SAMPLE_USER = {
    "email": "test.user@example.com",
    "password": "securepass123",
}


@pytest.fixture(autouse=True)
def auth_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    users_db = tmp_path / "users.json"
    suppliers_db = tmp_path / "suppliers.json"
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-pytest")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("USERS_DB_PATH", str(users_db))
    monkeypatch.setenv("SUPPLIERS_DB_PATH", str(suppliers_db))
    clear_settings_cache()
    reset_users_db()
    reset_db()
    yield
    clear_settings_cache()
    reset_users_db()
    reset_db()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/auth/register", json=SAMPLE_USER)
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_auth_headers(client: TestClient) -> dict[str, str]:
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
