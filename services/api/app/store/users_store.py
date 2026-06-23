"""TinyDB-backed user persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.core.security import hash_password, verify_password
from app.core.tinydb import get_users_table, reset_users_db
from app.schemas.users import UserCreateSchema, UserResponseSchema, UserUpdateSchema

__all__ = [
    "change_user_password",
    "create_user",
    "delete_user",
    "get_user_by_email",
    "get_user_by_id",
    "get_user_document_by_email",
    "get_user_document_by_id",
    "list_users",
    "reset_users_db",
    "update_user",
    "verify_user_credentials",
]


class DuplicateEmailError(Exception):
    """Raised when creating a user with an email that already exists."""


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_datetime(value: datetime) -> str:
    return value.isoformat()


def _to_response(document: dict[str, Any]) -> UserResponseSchema:
    created_at = document["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)

    return UserResponseSchema(
        id=document["id"],
        email=document["email"],
        name=document.get("name", "") or "",
        is_active=document["is_active"],
        created_at=created_at,
    )


def get_user_document_by_email(email: str) -> dict[str, Any] | None:
    table = get_users_table()
    normalized = email.lower()
    return table.get(lambda doc: doc.get("email", "").lower() == normalized)


def create_user(payload: UserCreateSchema) -> UserResponseSchema:
    if get_user_document_by_email(payload.email) is not None:
        raise DuplicateEmailError(f"User with email {payload.email} already exists.")

    table = get_users_table()
    now = _utc_now()
    document: dict[str, Any] = {
        "id": str(uuid4()),
        "email": payload.email.lower(),
        "name": (payload.name or "").strip(),
        "hashed_password": hash_password(payload.password),
        "is_active": True,
        "created_at": _serialize_datetime(now),
    }
    table.insert(document)
    return _to_response(document)


def list_users() -> list[UserResponseSchema]:
    table = get_users_table()
    return [_to_response(doc) for doc in table.all()]


def get_user_document_by_id(user_id: str) -> dict[str, Any] | None:
    table = get_users_table()
    return table.get(lambda doc: doc.get("id") == user_id)


def get_user_by_id(user_id: str) -> UserResponseSchema | None:
    document = get_user_document_by_id(user_id)
    if document is None:
        return None
    return _to_response(document)


def get_user_by_email(email: str) -> UserResponseSchema | None:
    document = get_user_document_by_email(email)
    if document is None:
        return None
    return _to_response(document)


def update_user(
    user_id: str,
    payload: UserUpdateSchema,
) -> UserResponseSchema | None:
    table = get_users_table()
    document = table.get(lambda doc: doc.get("id") == user_id)
    if document is None:
        return None

    if payload.email is not None:
        normalized = payload.email.lower()
        existing = get_user_document_by_email(normalized)
        if existing is not None and existing.get("id") != user_id:
            raise DuplicateEmailError(f"User with email {payload.email} already exists.")
        document["email"] = normalized

    if payload.password is not None:
        document["hashed_password"] = hash_password(payload.password)

    if payload.name is not None:
        document["name"] = payload.name.strip()

    if payload.is_active is not None:
        document["is_active"] = payload.is_active

    table.update(document, lambda doc: doc.get("id") == user_id)
    return _to_response(document)


def delete_user(user_id: str) -> bool:
    table = get_users_table()
    removed = table.remove(lambda doc: doc.get("id") == user_id)
    return len(removed) > 0


def change_user_password(
    user_id: str,
    current_password: str,
    new_password: str,
) -> bool:
    document = get_user_document_by_id(user_id)
    if document is None:
        return False
    if not verify_password(current_password, document["hashed_password"]):
        return False

    table = get_users_table()
    document["hashed_password"] = hash_password(new_password)
    table.update(document, lambda doc: doc.get("id") == user_id)
    return True


def verify_user_credentials(email: str, password: str) -> UserResponseSchema | None:
    document = get_user_document_by_email(email)
    if document is None:
        return None
    if not document.get("is_active", False):
        return None
    if not verify_password(password, document["hashed_password"]):
        return None
    return _to_response(document)
