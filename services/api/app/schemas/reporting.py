"""Pydantic schemas for reporting API."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class WeeklyPerformanceEntrySchema(BaseModel):
    office: str
    programme_id: str
    total_material_cost: float
    kits_delivered_count: int
    shortage_events_count: int
    cost_variance_events_count: int
    currency: str


class WeeklyPerformanceResponseSchema(BaseModel):
    week_start: date
    entries: list[WeeklyPerformanceEntrySchema]


class ComputeWeeklyPerformanceRequest(BaseModel):
    week_start: date | None = Field(
        default=None,
        description="ISO week Monday (UTC). Defaults to current ISO week Monday.",
    )


class ComputeWeeklyPerformanceResponse(BaseModel):
    week_start: date
    records_loaded: int
    computed_at: datetime


class PipelineRunDataSchema(BaseModel):
    run_id: str
    flow_name: str
    trigger_mode: str
    status: str
    source_window_start: datetime | None = None
    source_window_end: datetime | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    records_extracted: int | None = None
    records_loaded: int | None = None
    error_count: int | None = None
    error_summary: str | None = None


class PipelineRunEnvelopeSchema(BaseModel):
    data: PipelineRunDataSchema


class PipelineRunTriggerRequest(BaseModel):
    trigger_mode: str = "manual"
    source_window_start: datetime
    source_window_end: datetime
