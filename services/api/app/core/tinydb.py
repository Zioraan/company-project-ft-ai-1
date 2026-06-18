"""TinyDB initialization for supplier persistence."""

from __future__ import annotations

import os
from pathlib import Path

from tinydb import TinyDB
from tinydb.table import Table

API_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = API_ROOT / "data" / "suppliers.json"

_db: TinyDB | None = None
_table: Table | None = None


def get_db_path() -> Path:
    override = os.environ.get("SUPPLIERS_DB_PATH")
    if override:
        return Path(override)
    return DEFAULT_DB_PATH


def get_suppliers_table() -> Table:
    global _db, _table

    if _table is not None:
        return _table

    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    _db = TinyDB(str(db_path))
    _table = _db.table("suppliers")
    return _table


def reset_db() -> None:
    """Close the current connection and clear cached handles (for tests)."""
    global _db, _table

    if _db is not None:
        _db.close()
        _db = None
        _table = None
