"""Tests for the inventory FastAPI routes."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.seed.inventory_seed import INVENTORY_SEED
from sqlmodel import Session

from app.core.database import get_engine, reset_inventory_db
from app.store import inventory_store

SAMPLE_ASSET = {
    "name": "Test Monitor",
    "sku": "NXV-TEST-001",
    "category": "hardware",
    "office": "Valencia",
}


def test_unauthenticated_inventory_returns_401(client: TestClient) -> None:
    assert client.get("/inventory/products").status_code == 401
    assert client.post("/inventory/products", json=SAMPLE_ASSET).status_code == 401
    assert client.get("/inventory/products/1").status_code == 401
    assert client.post("/inventory/orders/inbound", json={}).status_code == 401
    assert client.post("/inventory/orders/outbound", json={}).status_code == 401
    assert client.get("/inventory/orders").status_code == 401


def test_create_product_starts_with_zero_stock(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/inventory/products",
        json=SAMPLE_ASSET,
        headers=auth_headers,
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["current_stock"] == 0
    assert payload["sku"] == SAMPLE_ASSET["sku"]


def test_get_product_returns_current_stock(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/inventory/products",
        json=SAMPLE_ASSET,
        headers=auth_headers,
    )
    asset_id = create_response.json()["id"]

    client.post(
        "/inventory/orders/inbound",
        json={
            "asset_id": asset_id,
            "quantity": 10,
            "supplier": "Test Supplier",
            "office": "Valencia",
        },
        headers=auth_headers,
    )

    response = client.get(f"/inventory/products/{asset_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["current_stock"] == 10


def test_list_products_includes_computed_stock_from_seed(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.get("/inventory/products", headers=auth_headers)
    assert response.status_code == 200
    products = response.json()
    laptop = next(item for item in products if item["sku"] == "NXV-IT-001")
    assert laptop["current_stock"] == 12


def test_inbound_order_stores_authenticated_user_uuid(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    me = client.get("/auth/me", headers=auth_headers).json()
    create_response = client.post(
        "/inventory/products",
        json={
            **SAMPLE_ASSET,
            "sku": "NXV-TEST-002",
        },
        headers=auth_headers,
    )
    asset_id = create_response.json()["id"]

    response = client.post(
        "/inventory/orders/inbound",
        json={
            "asset_id": asset_id,
            "quantity": 4,
            "supplier": "Inbound Supplier",
            "office": "Valencia",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["user_uuid"] == me["id"]


def test_outbound_order_rejects_insufficient_stock(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/inventory/products",
        json={
            **SAMPLE_ASSET,
            "sku": "NXV-TEST-003",
        },
        headers=auth_headers,
    )
    asset_id = create_response.json()["id"]

    response = client.post(
        "/inventory/orders/outbound",
        json={
            "asset_id": asset_id,
            "quantity": 1,
            "exit_type": "consumption",
            "office": "Valencia",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]
    assert response.json()["detail"].endswith("Available: 0, requested: 1.")


def test_outbound_allocation_requires_assigned_to(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    products = client.get("/inventory/products", headers=auth_headers).json()
    asset_id = next(item["id"] for item in products if item["sku"] == "NXV-IT-001")

    response = client.post(
        "/inventory/orders/outbound",
        json={
            "asset_id": asset_id,
            "quantity": 1,
            "exit_type": "allocation",
            "office": "Valencia",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_outbound_consumption_rejects_assigned_to(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    products = client.get("/inventory/products", headers=auth_headers).json()
    asset_id = next(item["id"] for item in products if item["sku"] == "NXV-IT-001")

    response = client.post(
        "/inventory/orders/outbound",
        json={
            "asset_id": asset_id,
            "quantity": 1,
            "exit_type": "consumption",
            "assigned_to": "Should Not Be Set",
            "office": "Valencia",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_list_orders_includes_product_name_and_type(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.get("/inventory/orders", headers=auth_headers)
    assert response.status_code == 200
    orders = response.json()
    assert len(orders) >= 7
    inbound = next(item for item in orders if item["order_type"] == "inbound")
    outbound = next(item for item in orders if item["order_type"] == "outbound")
    assert inbound["asset_name"]
    assert inbound["user_uuid"]
    assert outbound["asset_name"]
    assert outbound["user_uuid"]


def test_repeated_inventory_seed_is_idempotent() -> None:
    reset_inventory_db()
    with Session(get_engine()) as session:
        first = inventory_store.seed_inventory(session, INVENTORY_SEED)
        second = inventory_store.seed_inventory(session, INVENTORY_SEED)
    assert first["assets"] == 6
    assert first["entries"] == 4
    assert first["exits"] == 3
    assert second == {"assets": 0, "entries": 0, "exits": 0}


def test_get_product_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/inventory/products/99999", headers=auth_headers)
    assert response.status_code == 404
