"""TinyDB initialization for supplier and user persistence."""

from __future__ import annotations

import os
from pathlib import Path

from tinydb import TinyDB
from tinydb.table import Table

API_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SUPPLIERS_DB_PATH = API_ROOT / "data" / "suppliers.json"
DEFAULT_USERS_DB_PATH = API_ROOT / "data" / "users.json"

_db: TinyDB | None = None
_table: Table | None = None
_users_db: TinyDB | None = None
_users_table: Table | None = None
_reset_tokens_table: Table | None = None


def get_db_path() -> Path:
    override = os.environ.get("SUPPLIERS_DB_PATH")
    if override:
        return Path(override)
    return DEFAULT_SUPPLIERS_DB_PATH


def get_users_db_path() -> Path:
    override = os.environ.get("USERS_DB_PATH")
    if override:
        return Path(override)
    return DEFAULT_USERS_DB_PATH


def get_suppliers_table() -> Table:
    global _db, _table

    if _table is not None:
        return _table

    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    _db = TinyDB(str(db_path))
    _table = _db.table("suppliers")
    return _table


def get_users_table() -> Table:
    global _users_db, _users_table

    if _users_table is not None:
        return _users_table

    db_path = get_users_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    _users_db = TinyDB(str(db_path))
    _users_table = _users_db.table("users")
    return _users_table


def get_reset_tokens_table() -> Table:
    global _users_db, _reset_tokens_table

    if _reset_tokens_table is not None:
        return _reset_tokens_table

    get_users_table()
    assert _users_db is not None
    _reset_tokens_table = _users_db.table("password_reset_tokens")
    return _reset_tokens_table


def reset_db() -> None:
    """Close the current supplier connection and clear cached handles (for tests)."""
    global _db, _table

    if _db is not None:
        _db.close()
        _db = None
        _table = None


def reset_users_db() -> None:
    """Close the current users connection and clear cached handles (for tests)."""
    global _users_db, _users_table, _reset_tokens_table

    if _users_db is not None:
        _users_db.close()
        _users_db = None
        _users_table = None
        _reset_tokens_table = None
