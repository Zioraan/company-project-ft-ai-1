"""Tests for authentication and user management API routes."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.store.users_store import get_user_document_by_email

SAMPLE_USER = {
    "email": "auth.test@example.com",
    "password": "securepass123",
}


def test_register_user_via_users_endpoint(client: TestClient) -> None:
    response = client.post("/users", json=SAMPLE_USER)

    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == SAMPLE_USER["email"]
    assert payload["is_active"] is True
    assert "hashed_password" not in payload
    assert "password" not in payload


def test_register_via_auth_returns_token(client: TestClient) -> None:
    response = client.post("/auth/register", json=SAMPLE_USER)

    assert response.status_code == 201
    payload = response.json()
    assert payload["access_token"]
    assert payload["token_type"] == "bearer"


def test_password_is_hashed_in_storage(client: TestClient) -> None:
    client.post("/users", json=SAMPLE_USER)

    document = get_user_document_by_email(SAMPLE_USER["email"])
    assert document is not None
    assert document["hashed_password"] != SAMPLE_USER["password"]


def test_login_returns_valid_jwt(client: TestClient) -> None:
    client.post("/auth/register", json=SAMPLE_USER)

    response = client.post(
        "/auth/login",
        json={"email": SAMPLE_USER["email"], "password": SAMPLE_USER["password"]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"]
    assert payload["token_type"] == "bearer"


def test_login_wrong_password_returns_401(client: TestClient) -> None:
    client.post("/auth/register", json=SAMPLE_USER)

    response = client.post(
        "/auth/login",
        json={"email": SAMPLE_USER["email"], "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_auth_me_requires_token(client: TestClient) -> None:
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_auth_me_returns_current_user(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "test.user@example.com"


def test_list_users_requires_auth(client: TestClient) -> None:
    response = client.get("/users")
    assert response.status_code == 401


def test_list_users_with_auth(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/users", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_user_by_id(client: TestClient, auth_headers: dict[str, str]) -> None:
    me_response = client.get("/auth/me", headers=auth_headers)
    user_id = me_response.json()["id"]

    response = client.get(f"/users/{user_id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == user_id


def test_update_own_user_name(client: TestClient, auth_headers: dict[str, str]) -> None:
    me_response = client.get("/auth/me", headers=auth_headers)
    user_id = me_response.json()["id"]

    response = client.put(
        f"/users/{user_id}",
        headers=auth_headers,
        json={"name": "Test User"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Test User"


def test_register_with_name(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        json={**SAMPLE_USER, "email": "named.user@example.com", "name": "Named User"},
    )
    assert response.status_code == 201

    me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    )
    assert me.json()["name"] == "Named User"


def test_change_password_success(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "securepass123",
            "new_password": "newsecurepass1",
        },
    )
    assert response.status_code == 204

    login_old = client.post(
        "/auth/login",
        json={"email": "test.user@example.com", "password": "securepass123"},
    )
    assert login_old.status_code == 401

    login_new = client.post(
        "/auth/login",
        json={"email": "test.user@example.com", "password": "newsecurepass1"},
    )
    assert login_new.status_code == 200


def test_change_password_wrong_current(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "wrong-password",
            "new_password": "newsecurepass1",
        },
    )
    assert response.status_code == 401


def test_update_own_user(client: TestClient, auth_headers: dict[str, str]) -> None:
    me_response = client.get("/auth/me", headers=auth_headers)
    user_id = me_response.json()["id"]

    response = client.put(
        f"/users/{user_id}",
        headers=auth_headers,
        json={"email": "updated.user@example.com"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "updated.user@example.com"


def test_update_other_user_returns_403(
    client: TestClient,
    auth_headers: dict[str, str],
    second_auth_headers: dict[str, str],
) -> None:
    other_me = client.get("/auth/me", headers=second_auth_headers)
    other_user_id = other_me.json()["id"]

    response = client.put(
        f"/users/{other_user_id}",
        headers=auth_headers,
        json={"email": "hijack@example.com"},
    )

    assert response.status_code == 403


def test_delete_own_user(client: TestClient, auth_headers: dict[str, str]) -> None:
    me_response = client.get("/auth/me", headers=auth_headers)
    user_id = me_response.json()["id"]

    response = client.delete(f"/users/{user_id}", headers=auth_headers)

    assert response.status_code == 204
    follow_up = client.get(f"/users/{user_id}", headers=auth_headers)
    assert follow_up.status_code == 401


def test_delete_other_user_returns_403(
    client: TestClient,
    auth_headers: dict[str, str],
    second_auth_headers: dict[str, str],
) -> None:
    other_me = client.get("/auth/me", headers=second_auth_headers)
    other_user_id = other_me.json()["id"]

    response = client.delete(f"/users/{other_user_id}", headers=auth_headers)

    assert response.status_code == 403


def test_inactive_user_cannot_login(client: TestClient, auth_headers: dict[str, str]) -> None:
    me_response = client.get("/auth/me", headers=auth_headers)
    user_id = me_response.json()["id"]

    deactivate = client.put(
        f"/users/{user_id}",
        headers=auth_headers,
        json={"is_active": False},
    )
    assert deactivate.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={"email": "test.user@example.com", "password": "securepass123"},
    )
    assert login_response.status_code == 401


def test_protected_supplier_route_returns_401_without_token(client: TestClient) -> None:
    response = client.get("/api/suppliers")
    assert response.status_code == 401


def test_settings_read_from_environment(
    client: TestClient,
    monkeypatch,
) -> None:
    from app.core.config import clear_settings_cache, get_settings

    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "45")
    clear_settings_cache()
    settings = get_settings()
    assert settings.access_token_expire_minutes == 45


def test_users_db_path_override(tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    custom_path = tmp_path / "custom-users.json"
    monkeypatch.setenv("USERS_DB_PATH", str(custom_path))

    from app.core.tinydb import get_users_db_path, reset_users_db

    reset_users_db()
    assert get_users_db_path() == custom_path
