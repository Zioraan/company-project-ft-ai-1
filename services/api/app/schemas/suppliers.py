"""Pydantic schemas for supplier directory API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

VALID_CATEGORIES = [
    "job_boards",
    "ats_software",
    "assessment_tools",
    "training_platforms",
    "payroll_and_hr_software",
    "video_interview",
    "background_check",
    "office_and_facilities",
    "it_and_software_licenses",
]

VALID_STATUSES = ["active", "suspended"]
VALID_COUNTRIES = ["Spain", "USA"]
VALID_CURRENCIES = ["EUR", "USD"]

CountryType = Literal["Spain", "USA"]
CurrencyType = Literal["EUR", "USD"]
StatusType = Literal["active", "suspended"]


def _validate_country_currency(country: str, currency: str) -> None:
    expected = "EUR" if country == "Spain" else "USD"
    if currency != expected:
        raise ValueError(
            f"Currency must be {expected} for suppliers from {country}."
        )


class SupplierCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    country: CountryType
    categories: list[str] = Field(..., min_length=1)
    monthly_rate: float = Field(..., gt=0)
    currency: CurrencyType
    status: StatusType
    contract_renewal_date: str | None = None
    contact_email: str | None = None
    notes: str | None = None

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, value: list[str]) -> list[str]:
        invalid = [item for item in value if item not in VALID_CATEGORIES]
        if invalid:
            raise ValueError(f"Invalid categories: {', '.join(invalid)}")
        return value

    @model_validator(mode="after")
    def validate_country_currency_pair(self) -> SupplierCreateSchema:
        _validate_country_currency(self.country, self.currency)
        return self


class SupplierRateUpdateSchema(BaseModel):
    monthly_rate: float = Field(..., gt=0)


class SupplierStatusUpdateSchema(BaseModel):
    status: StatusType


class SupplierResponseSchema(BaseModel):
    id: str
    name: str
    country: CountryType
    categories: list[str]
    monthly_rate: float
    currency: CurrencyType
    rate_updated_at: datetime
    status: StatusType
    contract_renewal_date: str | None = None
    contact_email: str | None = None
    notes: str | None = None
