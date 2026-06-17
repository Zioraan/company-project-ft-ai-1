"""TinyDB-backed supplier persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.core.tinydb import get_suppliers_table, reset_db
from app.schemas.suppliers import (
    SupplierCreateSchema,
    SupplierRateUpdateSchema,
    SupplierResponseSchema,
    SupplierStatusUpdateSchema,
)

__all__ = [
    "create_supplier",
    "delete_supplier",
    "get_supplier",
    "list_suppliers",
    "reset_db",
    "seed_suppliers",
    "update_rate",
    "update_status",
]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_response(document: dict[str, Any]) -> SupplierResponseSchema:
    rate_updated_at = document["rate_updated_at"]
    if isinstance(rate_updated_at, str):
        rate_updated_at = datetime.fromisoformat(rate_updated_at)

    return SupplierResponseSchema(
        id=document["id"],
        name=document["name"],
        country=document["country"],
        categories=document["categories"],
        monthly_rate=document["monthly_rate"],
        currency=document["currency"],
        rate_updated_at=rate_updated_at,
        status=document["status"],
        contract_renewal_date=document.get("contract_renewal_date"),
        contact_email=document.get("contact_email"),
        notes=document.get("notes"),
    )


def _serialize_datetime(value: datetime) -> str:
    return value.isoformat()


def create_supplier(payload: SupplierCreateSchema) -> SupplierResponseSchema:
    table = get_suppliers_table()
    now = _utc_now()
    document: dict[str, Any] = {
        "id": str(uuid4()),
        "name": payload.name,
        "country": payload.country,
        "categories": payload.categories,
        "monthly_rate": payload.monthly_rate,
        "currency": payload.currency,
        "rate_updated_at": _serialize_datetime(now),
        "status": payload.status,
        "contract_renewal_date": payload.contract_renewal_date,
        "contact_email": payload.contact_email,
        "notes": payload.notes,
    }
    table.insert(document)
    return _to_response(document)


def list_suppliers(
    *,
    country: str | None = None,
    category: str | None = None,
) -> list[SupplierResponseSchema]:
    table = get_suppliers_table()
    documents = table.all()

    if country is not None:
        documents = [doc for doc in documents if doc.get("country") == country]

    if category is not None:
        documents = [
            doc
            for doc in documents
            if category in (doc.get("categories") or [])
        ]

    return [_to_response(doc) for doc in documents]


def get_supplier(supplier_id: str) -> SupplierResponseSchema | None:
    table = get_suppliers_table()
    document = table.get(lambda doc: doc.get("id") == supplier_id)
    if document is None:
        return None
    return _to_response(document)


def update_rate(
    supplier_id: str,
    payload: SupplierRateUpdateSchema,
) -> SupplierResponseSchema | None:
    table = get_suppliers_table()
    document = table.get(lambda doc: doc.get("id") == supplier_id)
    if document is None:
        return None

    if document["monthly_rate"] != payload.monthly_rate:
        document["monthly_rate"] = payload.monthly_rate
        document["rate_updated_at"] = _serialize_datetime(_utc_now())
        table.update(document, lambda doc: doc.get("id") == supplier_id)

    return _to_response(document)


def update_status(
    supplier_id: str,
    payload: SupplierStatusUpdateSchema,
) -> SupplierResponseSchema | None:
    table = get_suppliers_table()
    document = table.get(lambda doc: doc.get("id") == supplier_id)
    if document is None:
        return None

    document["status"] = payload.status
    table.update(document, lambda doc: doc.get("id") == supplier_id)
    return _to_response(document)


def delete_supplier(supplier_id: str) -> bool:
    table = get_suppliers_table()
    removed = table.remove(lambda doc: doc.get("id") == supplier_id)
    return len(removed) > 0


def _find_by_name_country(name: str, country: str) -> dict[str, Any] | None:
    table = get_suppliers_table()
    return table.get(
        lambda doc: doc.get("name") == name and doc.get("country") == country
    )


def seed_suppliers(seed_data: list[dict[str, Any]]) -> dict[str, int]:
    inserted = 0
    skipped = 0

    for entry in seed_data:
        existing = _find_by_name_country(entry["name"], entry["country"])
        if existing is not None:
            skipped += 1
            continue

        payload = SupplierCreateSchema(**entry)
        create_supplier(payload)
        inserted += 1

    return {"inserted": inserted, "skipped": skipped}
