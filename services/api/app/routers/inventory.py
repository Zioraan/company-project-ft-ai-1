"""Inventory management API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.inventory import (
    AssetCreateSchema,
    AssetEntryCreateSchema,
    AssetEntryResponseSchema,
    AssetExitCreateSchema,
    AssetExitResponseSchema,
    AssetResponseSchema,
    DirectStockEditSchema,
    OrderHistoryItemSchema,
    currency_for_office,
)
from app.schemas.telemetry import TelemetryEvent
from app.schemas.users import UserResponseSchema
from app.store import inventory_store
from app.store import telemetry_store

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[UserResponseSchema, Depends(get_current_user)]


@router.get("/products", response_model=list[AssetResponseSchema])
def list_products_route(session: DbSession) -> list[AssetResponseSchema]:
    return inventory_store.list_assets(session)


@router.post(
    "/products",
    response_model=AssetResponseSchema,
    status_code=201,
)
def create_product_route(
    payload: AssetCreateSchema,
    session: DbSession,
) -> AssetResponseSchema:
    return inventory_store.create_asset(session, payload)


@router.get("/products/{asset_id}", response_model=AssetResponseSchema)
def get_product_route(
    asset_id: int,
    session: DbSession,
) -> AssetResponseSchema:
    asset = inventory_store.get_asset(session, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


@router.patch("/products/{asset_id}/stock")
def reject_direct_stock_edit_route(
    asset_id: int,
    payload: DirectStockEditSchema,
    session: DbSession,
    current_user: CurrentUser,
) -> None:
    """Reject direct stock mutation; stock changes must go through orders."""
    asset = inventory_store.get_asset(session, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found.")

    office = (
        "valencia"
        if asset.office.lower() == "valencia" or asset.office == "Valencia"
        else "miami"
        if asset.office.lower() == "miami" or asset.office == "Miami"
        else asset.office.lower()
    )
    event = TelemetryEvent(
        eventId=str(uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        sessionId="platform-api",
        userId=current_user.id,
        event_type="direct_stock_edit_rejected",
        schemaVersion="1.0.0",
        requestId=str(uuid4()),
        properties={
            "product_id": asset.id,
            "product_category": asset.category,
            "programme_id": asset.programme_id,
            "office": office,
            "quantity": payload.quantity,
            "currency": currency_for_office(asset.office),
            "attempted_operation": "direct_stock_patch",
        },
    )
    telemetry_store.bulk_insert_events(
        session,
        [event],
        service="platform_api",
    )
    raise HTTPException(
        status_code=403,
        detail=(
            "Direct stock edits are not allowed. "
            "Use inbound or outbound orders to change stock."
        ),
    )


@router.post(
    "/orders/inbound",
    response_model=AssetEntryResponseSchema,
    status_code=201,
)
def create_inbound_order_route(
    payload: AssetEntryCreateSchema,
    session: DbSession,
    current_user: CurrentUser,
) -> AssetEntryResponseSchema:
    return inventory_store.create_asset_entry(
        session,
        payload,
        user_uuid=current_user.id,
    )


@router.post(
    "/orders/outbound",
    response_model=AssetExitResponseSchema,
    status_code=201,
)
def create_outbound_order_route(
    payload: AssetExitCreateSchema,
    session: DbSession,
    current_user: CurrentUser,
) -> AssetExitResponseSchema:
    return inventory_store.create_asset_exit(
        session,
        payload,
        user_uuid=current_user.id,
    )


@router.get("/orders", response_model=list[OrderHistoryItemSchema])
def list_orders_route(session: DbSession) -> list[OrderHistoryItemSchema]:
    return inventory_store.list_orders(session)
