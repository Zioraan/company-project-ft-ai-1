"""Pydantic schemas for incident analysis API responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TotalsSchema(BaseModel):
    total_records: int
    valid_count: int
    invalid_count: int


class BreakdownItemSchema(BaseModel):
    label: str
    count: int
    percentage: float | None = None


class SatisfactionSchema(BaseModel):
    scored_tickets: int
    closed_tickets: int
    average: float
    distribution: dict[int, int]


class AnalysisResponseSchema(BaseModel):
    source_name: str
    totals: TotalsSchema
    invalid_breakdown: list[BreakdownItemSchema]
    by_category: list[BreakdownItemSchema]
    by_status: list[BreakdownItemSchema]
    satisfaction: SatisfactionSchema


class ErrorResponseSchema(BaseModel):
    error: str = Field(..., description="Human-readable error message")
