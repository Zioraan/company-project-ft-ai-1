"""Password reset token persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.tinydb import get_reset_tokens_table

__all__ = [
    "create_reset_token_record",
    "is_reset_token_valid",
    "mark_reset_token_used",
]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_datetime(value: datetime) -> str:
    return value.isoformat()


def create_reset_token_record(jti: str, user_id: str, expires_at: datetime) -> None:
    table = get_reset_tokens_table()
    document: dict[str, Any] = {
        "jti": jti,
        "user_id": user_id,
        "expires_at": _serialize_datetime(expires_at),
        "used_at": None,
    }
    table.insert(document)


def _get_record(jti: str) -> dict[str, Any] | None:
    table = get_reset_tokens_table()
    return table.get(lambda doc: doc.get("jti") == jti)


def is_reset_token_valid(jti: str) -> bool:
    record = _get_record(jti)
    if record is None:
        return False
    if record.get("used_at") is not None:
        return False

    expires_at = record["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)

    return expires_at > _utc_now()


def mark_reset_token_used(jti: str) -> None:
    table = get_reset_tokens_table()
    record = _get_record(jti)
    if record is None:
        return
    record["used_at"] = _serialize_datetime(_utc_now())
    table.update(record, lambda doc: doc.get("jti") == jti)
