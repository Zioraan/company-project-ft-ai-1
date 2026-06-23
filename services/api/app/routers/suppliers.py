"""Supplier directory API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.schemas.suppliers import (
    SupplierCreateSchema,
    SupplierRateUpdateSchema,
    SupplierResponseSchema,
    SupplierStatusUpdateSchema,
)
from app.store import suppliers_store

router = APIRouter(
    prefix="/api/suppliers",
    tags=["suppliers"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=SupplierResponseSchema,
    status_code=201,
)
def create_supplier_route(payload: SupplierCreateSchema) -> SupplierResponseSchema:
    return suppliers_store.create_supplier(payload)


@router.get("/", response_model=list[SupplierResponseSchema])
def list_suppliers_route(
    country: str | None = Query(default=None),
    category: str | None = Query(default=None),
) -> list[SupplierResponseSchema]:
    return suppliers_store.list_suppliers(country=country, category=category)


@router.get("/{supplier_id}", response_model=SupplierResponseSchema)
def get_supplier_route(supplier_id: str) -> SupplierResponseSchema:
    supplier = suppliers_store.get_supplier(supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.patch("/{supplier_id}/rate", response_model=SupplierResponseSchema)
def update_supplier_rate(
    supplier_id: str,
    payload: SupplierRateUpdateSchema,
) -> SupplierResponseSchema:
    supplier = suppliers_store.update_rate(supplier_id, payload)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.patch("/{supplier_id}/status", response_model=SupplierResponseSchema)
def update_supplier_status(
    supplier_id: str,
    payload: SupplierStatusUpdateSchema,
) -> SupplierResponseSchema:
    supplier = suppliers_store.update_status(supplier_id, payload)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier_route(supplier_id: str) -> None:
    deleted = suppliers_store.delete_supplier(supplier_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Supplier not found.")
