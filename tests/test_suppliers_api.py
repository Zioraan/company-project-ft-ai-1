"""Tests for the suppliers FastAPI routes."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from app.core.tinydb import get_db_path, reset_db  # noqa: E402
from app.main import app  # noqa: E402
from app.seed.suppliers_seed import SUPPLIERS_SEED  # noqa: E402
from app.store.suppliers_store import get_supplier, seed_suppliers  # noqa: E402

SAMPLE_SUPPLIER = {
    "name": "Test Supplier",
    "country": "Spain",
    "categories": ["job_boards"],
    "monthly_rate": 100.0,
    "currency": "EUR",
    "status": "active",
}


@pytest.fixture(autouse=True)
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    db_file = tmp_path / "suppliers.json"
    monkeypatch.setenv("SUPPLIERS_DB_PATH", str(db_file))
    reset_db()
    yield
    reset_db()
    if db_file.exists():
        db_file.unlink()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_create_supplier_returns_complete_object(client: TestClient) -> None:
    response = client.post("/api/suppliers", json=SAMPLE_SUPPLIER)

    assert response.status_code == 201
    payload = response.json()
    assert payload["id"]
    assert payload["name"] == SAMPLE_SUPPLIER["name"]
    assert payload["rate_updated_at"]


def test_list_suppliers_without_filters(client: TestClient) -> None:
    client.post("/api/suppliers", json=SAMPLE_SUPPLIER)
    usa_supplier = {
        **SAMPLE_SUPPLIER,
        "name": "USA Supplier",
        "country": "USA",
        "currency": "USD",
    }
    client.post("/api/suppliers", json=usa_supplier)

    response = client.get("/api/suppliers")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_suppliers_country_filter(client: TestClient) -> None:
    client.post("/api/suppliers", json=SAMPLE_SUPPLIER)
    client.post(
        "/api/suppliers",
        json={
            **SAMPLE_SUPPLIER,
            "name": "USA Supplier",
            "country": "USA",
            "currency": "USD",
        },
    )

    response = client.get("/api/suppliers", params={"country": "Spain"})

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["country"] == "Spain"


def test_list_suppliers_category_filter(client: TestClient) -> None:
    client.post("/api/suppliers", json=SAMPLE_SUPPLIER)
    client.post(
        "/api/suppliers",
        json={
            **SAMPLE_SUPPLIER,
            "name": "ATS Supplier",
            "categories": ["ats_software"],
        },
    )

    response = client.get("/api/suppliers", params={"category": "ats_software"})

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["categories"] == ["ats_software"]


def test_get_supplier_detail_404(client: TestClient) -> None:
    response = client.get("/api/suppliers/missing-id")

    assert response.status_code == 404


def test_delete_supplier_404(client: TestClient) -> None:
    response = client.delete("/api/suppliers/missing-id")

    assert response.status_code == 404


def test_invalid_status_returns_422(client: TestClient) -> None:
    create_response = client.post("/api/suppliers", json=SAMPLE_SUPPLIER)
    supplier_id = create_response.json()["id"]

    response = client.patch(
        f"/api/suppliers/{supplier_id}/status",
        json={"status": "invalid"},
    )

    assert response.status_code == 422


def test_zero_monthly_rate_returns_422(client: TestClient) -> None:
    response = client.post(
        "/api/suppliers",
        json={**SAMPLE_SUPPLIER, "monthly_rate": 0},
    )

    assert response.status_code == 422


def test_negative_monthly_rate_returns_422(client: TestClient) -> None:
    response = client.post(
        "/api/suppliers",
        json={**SAMPLE_SUPPLIER, "monthly_rate": -10},
    )

    assert response.status_code == 422


def test_rate_update_changes_rate_updated_at(client: TestClient) -> None:
    create_response = client.post("/api/suppliers", json=SAMPLE_SUPPLIER)
    supplier = create_response.json()
    original_timestamp = supplier["rate_updated_at"]

    update_response = client.patch(
        f"/api/suppliers/{supplier['id']}/rate",
        json={"monthly_rate": 250.0},
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["monthly_rate"] == 250.0
    assert updated["rate_updated_at"] != original_timestamp


def test_repeated_seeding_does_not_duplicate(client: TestClient) -> None:
    first = seed_suppliers(SUPPLIERS_SEED)
    second = seed_suppliers(SUPPLIERS_SEED)

    assert first["inserted"] == len(SUPPLIERS_SEED)
    assert first["skipped"] == 0
    assert second["inserted"] == 0
    assert second["skipped"] == len(SUPPLIERS_SEED)

    response = client.get("/api/suppliers")
    assert len(response.json()) == len(SUPPLIERS_SEED)


def test_persistence_survives_reinitialization(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db_file = tmp_path / "persist-suppliers.json"
    monkeypatch.setenv("SUPPLIERS_DB_PATH", str(db_file))
    reset_db()

    with TestClient(app) as test_client:
        create_response = test_client.post("/api/suppliers", json=SAMPLE_SUPPLIER)
        assert create_response.status_code == 201
        supplier_id = create_response.json()["id"]

    reset_db()

    supplier = get_supplier(supplier_id)
    assert supplier is not None
    assert supplier.name == SAMPLE_SUPPLIER["name"]
    assert get_db_path() == db_file
    assert db_file.exists()
