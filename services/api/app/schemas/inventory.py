"""Pydantic request/response schemas for inventory API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

AssetCategory = Literal[
    "hardware",
    "peripherals",
    "office_supplies",
    "training_materials",
]
AssetOffice = Literal["Valencia", "Miami"]
ExitType = Literal["allocation", "consumption"]
OrderType = Literal["inbound", "outbound"]


class AssetCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    sku: str = Field(..., min_length=1)
    category: AssetCategory
    office: AssetOffice


class AssetResponseSchema(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    office: str
    current_stock: int


class AssetEntryCreateSchema(BaseModel):
    asset_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    supplier: str = Field(..., min_length=1)
    office: AssetOffice


class AssetEntryResponseSchema(BaseModel):
    id: int
    asset_id: int
    quantity: int
    supplier: str
    office: str
    created_at: datetime
    user_uuid: str


class AssetExitCreateSchema(BaseModel):
    asset_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    exit_type: ExitType
    assigned_to: str | None = None
    office: AssetOffice

    @model_validator(mode="after")
    def validate_assigned_to(self) -> "AssetExitCreateSchema":
        if self.exit_type == "allocation":
            if not self.assigned_to or not self.assigned_to.strip():
                raise ValueError(
                    "assigned_to is required when exit_type is 'allocation'."
                )
        elif self.exit_type == "consumption" and self.assigned_to is not None:
            raise ValueError(
                "assigned_to must be null when exit_type is 'consumption'."
            )
        return self


class AssetExitResponseSchema(BaseModel):
    id: int
    asset_id: int
    quantity: int
    exit_type: str
    assigned_to: str | None
    office: str
    created_at: datetime
    user_uuid: str


class OrderHistoryItemSchema(BaseModel):
    id: int
    order_type: OrderType
    asset_id: int
    asset_name: str
    quantity: int
    created_at: datetime
    user_uuid: str
    supplier: str | None = None
    exit_type: str | None = None
    assigned_to: str | None = None
    office: str
