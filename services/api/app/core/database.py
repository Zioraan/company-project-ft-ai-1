"""SQLModel engine and session management for inventory persistence."""

from __future__ import annotations

from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings

__all__ = [
    "dispose_engine",
    "get_db",
    "get_engine",
    "init_inventory_db",
    "reset_inventory_db",
]


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
    )


def init_inventory_db() -> None:
    """Create inventory tables if they do not exist."""
    from app.models import inventory  # noqa: F401 — register models with metadata

    SQLModel.metadata.create_all(get_engine())


def dispose_engine() -> None:
    get_engine().dispose()
    get_engine.cache_clear()


def get_db() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session


def reset_inventory_db() -> None:
    """Drop and recreate inventory tables. Used by tests."""
    from app.models import inventory  # noqa: F401

    engine = get_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
