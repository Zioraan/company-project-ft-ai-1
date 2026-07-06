"""SQLModel-backed inventory persistence and business rules."""

from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app.models.inventory import Asset, AssetEntry, AssetExit
from app.schemas.inventory import (
    AssetCreateSchema,
    AssetEntryCreateSchema,
    AssetEntryResponseSchema,
    AssetExitCreateSchema,
    AssetExitResponseSchema,
    AssetResponseSchema,
    OrderHistoryItemSchema,
)

__all__ = [
    "create_asset",
    "create_asset_entry",
    "create_asset_exit",
    "get_asset",
    "list_assets",
    "list_orders",
    "seed_inventory",
]


def _compute_stock(session: Session, asset_id: int) -> int:
    inbound = session.exec(
        select(func.coalesce(func.sum(AssetEntry.quantity), 0)).where(
            AssetEntry.asset_id == asset_id
        )
    ).one()
    outbound = session.exec(
        select(func.coalesce(func.sum(AssetExit.quantity), 0)).where(
            AssetExit.asset_id == asset_id
        )
    ).one()
    return int(inbound) - int(outbound)


def _to_asset_response(session: Session, asset: Asset) -> AssetResponseSchema:
    return AssetResponseSchema(
        id=asset.id,  # type: ignore[arg-type]
        name=asset.name,
        sku=asset.sku,
        category=asset.category,
        office=asset.office,
        current_stock=_compute_stock(session, asset.id),  # type: ignore[arg-type]
    )


def _to_entry_response(entry: AssetEntry) -> AssetEntryResponseSchema:
    return AssetEntryResponseSchema(
        id=entry.id,  # type: ignore[arg-type]
        asset_id=entry.asset_id,
        quantity=entry.quantity,
        supplier=entry.supplier,
        office=entry.office,
        created_at=entry.created_at,
        user_uuid=entry.user_uuid,
    )


def _to_exit_response(exit_row: AssetExit) -> AssetExitResponseSchema:
    return AssetExitResponseSchema(
        id=exit_row.id,  # type: ignore[arg-type]
        asset_id=exit_row.asset_id,
        quantity=exit_row.quantity,
        exit_type=exit_row.exit_type,
        assigned_to=exit_row.assigned_to,
        office=exit_row.office,
        created_at=exit_row.created_at,
        user_uuid=exit_row.user_uuid,
    )


def create_asset(session: Session, payload: AssetCreateSchema) -> AssetResponseSchema:
    existing = session.exec(
        select(Asset).where(Asset.sku == payload.sku)
    ).first()
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"An asset with SKU '{payload.sku}' already exists.",
        )

    asset = Asset(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        office=payload.office,
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return _to_asset_response(session, asset)


def list_assets(session: Session) -> list[AssetResponseSchema]:
    assets = session.exec(select(Asset).order_by(Asset.id)).all()
    return [_to_asset_response(session, asset) for asset in assets]


def get_asset(session: Session, asset_id: int) -> AssetResponseSchema | None:
    asset = session.get(Asset, asset_id)
    if asset is None:
        return None
    return _to_asset_response(session, asset)


def create_asset_entry(
    session: Session,
    payload: AssetEntryCreateSchema,
    user_uuid: str,
) -> AssetEntryResponseSchema:
    asset = session.get(Asset, payload.asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found.")

    entry = AssetEntry(
        asset_id=payload.asset_id,
        quantity=payload.quantity,
        supplier=payload.supplier,
        office=payload.office,
        user_uuid=user_uuid,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return _to_entry_response(entry)


def create_asset_exit(
    session: Session,
    payload: AssetExitCreateSchema,
    user_uuid: str,
) -> AssetExitResponseSchema:
    asset = session.get(Asset, payload.asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found.")

    available = _compute_stock(session, payload.asset_id)
    if payload.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock for asset '{asset.name}'. "
                f"Available: {available}, requested: {payload.quantity}."
            ),
        )

    assigned_to = payload.assigned_to if payload.exit_type == "allocation" else None
    exit_row = AssetExit(
        asset_id=payload.asset_id,
        quantity=payload.quantity,
        exit_type=payload.exit_type,
        assigned_to=assigned_to,
        office=payload.office,
        user_uuid=user_uuid,
    )
    session.add(exit_row)
    session.commit()
    session.refresh(exit_row)
    return _to_exit_response(exit_row)


def list_orders(session: Session) -> list[OrderHistoryItemSchema]:
    entries = session.exec(
        select(AssetEntry, Asset)
        .join(Asset, AssetEntry.asset_id == Asset.id)
        .order_by(AssetEntry.created_at.desc())
    ).all()
    exits = session.exec(
        select(AssetExit, Asset)
        .join(Asset, AssetExit.asset_id == Asset.id)
        .order_by(AssetExit.created_at.desc())
    ).all()

    history: list[OrderHistoryItemSchema] = []
    for entry, asset in entries:
        history.append(
            OrderHistoryItemSchema(
                id=entry.id,  # type: ignore[arg-type]
                order_type="inbound",
                asset_id=asset.id,  # type: ignore[arg-type]
                asset_name=asset.name,
                quantity=entry.quantity,
                created_at=entry.created_at,
                user_uuid=entry.user_uuid,
                supplier=entry.supplier,
                office=entry.office,
            )
        )
    for exit_row, asset in exits:
        history.append(
            OrderHistoryItemSchema(
                id=exit_row.id,  # type: ignore[arg-type]
                order_type="outbound",
                asset_id=asset.id,  # type: ignore[arg-type]
                asset_name=asset.name,
                quantity=exit_row.quantity,
                created_at=exit_row.created_at,
                user_uuid=exit_row.user_uuid,
                exit_type=exit_row.exit_type,
                assigned_to=exit_row.assigned_to,
                office=exit_row.office,
            )
        )

    history.sort(key=lambda item: item.created_at, reverse=True)
    return history


def seed_inventory(session: Session, seed_data: dict) -> dict[str, int]:
    """Idempotent inventory seed. Returns counts of inserted records."""
    inserted_assets = 0
    inserted_entries = 0
    inserted_exits = 0

    sku_to_id: dict[str, int] = {}
    for asset_data in seed_data.get("assets", []):
        existing = session.exec(
            select(Asset).where(Asset.sku == asset_data["sku"])
        ).first()
        if existing is not None:
            sku_to_id[existing.sku] = existing.id  # type: ignore[assignment]
            continue
        asset = Asset(**asset_data)
        session.add(asset)
        session.commit()
        session.refresh(asset)
        sku_to_id[asset.sku] = asset.id  # type: ignore[assignment]
        inserted_assets += 1

    existing_entry_count = session.exec(select(func.count()).select_from(AssetEntry)).one()
    if int(existing_entry_count) == 0:
        for entry_data in seed_data.get("entries", []):
            asset_id = sku_to_id.get(entry_data["sku"])
            if asset_id is None:
                asset = session.exec(
                    select(Asset).where(Asset.sku == entry_data["sku"])
                ).first()
                if asset is None:
                    continue
                asset_id = asset.id
                sku_to_id[entry_data["sku"]] = asset_id  # type: ignore[assignment]
            entry = AssetEntry(
                asset_id=asset_id,
                quantity=entry_data["quantity"],
                supplier=entry_data["supplier"],
                office=entry_data["office"],
                user_uuid=entry_data["user_uuid"],
            )
            session.add(entry)
            session.commit()
            session.refresh(entry)
            inserted_entries += 1

    existing_exit_count = session.exec(select(func.count()).select_from(AssetExit)).one()
    if int(existing_exit_count) == 0:
        for exit_data in seed_data.get("exits", []):
            asset_id = sku_to_id.get(exit_data["sku"])
            if asset_id is None:
                asset = session.exec(
                    select(Asset).where(Asset.sku == exit_data["sku"])
                ).first()
                if asset is None:
                    continue
                asset_id = asset.id
            exit_row = AssetExit(
                asset_id=asset_id,
                quantity=exit_data["quantity"],
                exit_type=exit_data["exit_type"],
                assigned_to=exit_data.get("assigned_to"),
                office=exit_data["office"],
                user_uuid=exit_data["user_uuid"],
            )
            session.add(exit_row)
            session.commit()
            session.refresh(exit_row)
            inserted_exits += 1

    return {
        "assets": inserted_assets,
        "entries": inserted_entries,
        "exits": inserted_exits,
    }
