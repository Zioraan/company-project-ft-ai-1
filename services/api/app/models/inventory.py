"""SQLModel inventory tables: Asset, AssetEntry, AssetExit."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Asset(SQLModel, table=True):
    __tablename__ = "asset"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    sku: str = Field(unique=True, index=True)
    category: str
    office: str
    programme_id: str = Field(default="unassigned", index=True)
    reorder_threshold: int = Field(default=5, ge=0)


class AssetEntry(SQLModel, table=True):
    __tablename__ = "asset_entry"

    id: int | None = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="asset.id", index=True)
    quantity: int = Field(gt=0)
    supplier: str
    office: str
    currency: str = Field(default="EUR")
    unit_cost: float = Field(default=0.0, ge=0)
    created_at: datetime = Field(default_factory=_utc_now)
    user_uuid: str


class AssetExit(SQLModel, table=True):
    __tablename__ = "asset_exit"

    id: int | None = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="asset.id", index=True)
    quantity: int = Field(gt=0)
    exit_type: str
    assigned_to: str | None = None
    office: str
    created_at: datetime = Field(default_factory=_utc_now)
    user_uuid: str
