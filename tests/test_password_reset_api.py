"""Tests for password reset API routes."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import get_settings
from app.core.security import create_password_reset_token
from app.store import reset_tokens_store

SAMPLE_USER = {
    "email": "reset.test@example.com",
    "password": "securepass123",
    "name": "Reset User",
}

GENERIC_MESSAGE = "If that address is registered, you'll receive a link shortly."


def test_forgot_password_unknown_email_returns_200(client: TestClient) -> None:
    response = client.post(
        "/auth/forgot-password",
        json={"email": "unknown@example.com"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == GENERIC_MESSAGE


def test_forgot_password_known_email_returns_200(client: TestClient) -> None:
    client.post("/auth/register", json=SAMPLE_USER)

    response = client.post(
        "/auth/forgot-password",
        json={"email": SAMPLE_USER["email"]},
    )

    assert response.status_code == 200
    assert response.json()["message"] == GENERIC_MESSAGE


def test_forgot_password_known_email_sends_reset_link(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    client.post("/auth/register", json=SAMPLE_USER)

    captured: dict[str, str] = {}

    def mock_send(*, to_email: str, reset_url: str) -> None:
        captured["to_email"] = to_email
        captured["reset_url"] = reset_url

    monkeypatch.setattr("app.routers.auth.send_password_reset_email", mock_send)

    response = client.post(
        "/auth/forgot-password",
        json={"email": SAMPLE_USER["email"]},
    )

    assert response.status_code == 200
    assert captured["to_email"] == SAMPLE_USER["email"]
    assert "token=" in captured["reset_url"]


def test_reset_password_updates_login(client: TestClient) -> None:
    register = client.post("/auth/register", json=SAMPLE_USER)
    user_id = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {register.json()['access_token']}"},
    ).json()["id"]

    token, jti = create_password_reset_token(user_id)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    reset_tokens_store.create_reset_token_record(jti, user_id, expires_at)

    response = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "brandnewpass1"},
    )
    assert response.status_code == 200

    old_login = client.post(
        "/auth/login",
        json={"email": SAMPLE_USER["email"], "password": SAMPLE_USER["password"]},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login",
        json={"email": SAMPLE_USER["email"], "password": "brandnewpass1"},
    )
    assert new_login.status_code == 200


def test_reset_password_used_token_returns_400(client: TestClient) -> None:
    register = client.post("/auth/register", json=SAMPLE_USER)
    user_id = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {register.json()['access_token']}"},
    ).json()["id"]

    token, jti = create_password_reset_token(user_id)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    reset_tokens_store.create_reset_token_record(jti, user_id, expires_at)

    first = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "brandnewpass1"},
    )
    assert first.status_code == 200

    second = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "anotherpass12"},
    )
    assert second.status_code == 400


def test_reset_password_expired_token_returns_400(client: TestClient) -> None:
    register = client.post("/auth/register", json=SAMPLE_USER)
    user_id = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {register.json()['access_token']}"},
    ).json()["id"]

    settings = get_settings()
    expired = datetime.now(timezone.utc) - timedelta(minutes=1)
    payload = {
        "sub": user_id,
        "jti": "expired-jti",
        "type": "password_reset",
        "exp": expired,
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    reset_tokens_store.create_reset_token_record("expired-jti", user_id, expired)

    response = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "brandnewpass1"},
    )
    assert response.status_code == 400


def test_reset_password_invalid_token_returns_400(client: TestClient) -> None:
    response = client.post(
        "/auth/reset-password",
        json={"token": "not-a-valid-token", "new_password": "brandnewpass1"},
    )
    assert response.status_code == 400
