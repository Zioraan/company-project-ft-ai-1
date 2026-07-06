"""Inventory management API routes."""

from __future__ import annotations

from typing import Annotated

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
    OrderHistoryItemSchema,
)
from app.schemas.users import UserResponseSchema
from app.store import inventory_store

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
