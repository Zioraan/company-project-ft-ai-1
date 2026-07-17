"""SQLModel engine and session management for inventory + telemetry persistence."""

from __future__ import annotations

from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, text
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings

__all__ = [
    "dispose_engine",
    "ensure_inventory_schema",
    "ensure_telemetry_indexes",
    "get_db",
    "get_engine",
    "init_inventory_db",
    "reset_inventory_db",
]

# create_all only creates missing tables; it does not ADD columns to existing ones.
_INVENTORY_SCHEMA_STATEMENTS = (
    "ALTER TABLE asset ADD COLUMN IF NOT EXISTS programme_id "
    "VARCHAR NOT NULL DEFAULT 'unassigned'",
    "ALTER TABLE asset ADD COLUMN IF NOT EXISTS reorder_threshold "
    "INTEGER NOT NULL DEFAULT 5",
    "CREATE INDEX IF NOT EXISTS ix_asset_programme_id ON asset (programme_id)",
    "ALTER TABLE asset_entry ADD COLUMN IF NOT EXISTS currency "
    "VARCHAR NOT NULL DEFAULT 'EUR'",
    "ALTER TABLE asset_entry ADD COLUMN IF NOT EXISTS unit_cost "
    "DOUBLE PRECISION NOT NULL DEFAULT 0.0",
)


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
    )


def _register_sql_models() -> None:
    from app.models import inventory  # noqa: F401 — register models with metadata
    from app.models import pipeline_runs  # noqa: F401
    from app.models import reporting  # noqa: F401
    from app.models import telemetry  # noqa: F401


def ensure_telemetry_indexes(engine: Engine | None = None) -> None:
    """Create Postgres-specific GIN index on tags when supported."""
    active_engine = engine or get_engine()
    if active_engine.dialect.name != "postgresql":
        return

    with active_engine.begin() as connection:
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_telemetry_events_tags_gin "
                "ON telemetry_events USING GIN (tags)"
            )
        )


def ensure_inventory_schema(engine: Engine | None = None) -> None:
    """Idempotently add inventory columns that create_all will not backfill.

    Only needed on PostgreSQL where tables may have been created before model
    fields were added. SQLite test DBs use drop/create and stay in sync.
    """
    active_engine = engine or get_engine()
    if active_engine.dialect.name != "postgresql":
        return

    with active_engine.begin() as connection:
        for statement in _INVENTORY_SCHEMA_STATEMENTS:
            connection.execute(text(statement))


def init_inventory_db() -> None:
    """Create inventory and telemetry tables if they do not exist."""
    _register_sql_models()
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
    ensure_inventory_schema(engine)
    ensure_telemetry_indexes(engine)


def dispose_engine() -> None:
    get_engine().dispose()
    get_engine.cache_clear()


def get_db() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session


def reset_inventory_db() -> None:
    """Drop and recreate SQL tables. Used by tests."""
    _register_sql_models()
    engine = get_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    ensure_telemetry_indexes(engine)
