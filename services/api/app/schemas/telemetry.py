"""Pydantic schemas for telemetry ingest."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class TelemetryEvent(BaseModel):
    """Standard event envelope for approved telemetry events."""

    eventId: str = Field(..., min_length=1)
    timestamp: str = Field(..., min_length=1)
    sessionId: str = Field(..., min_length=1)
    userId: str = Field(..., min_length=1)
    event_type: str = Field(..., min_length=1)
    schemaVersion: str = Field(..., min_length=1)
    requestId: str = Field(..., min_length=1)
    properties: dict[str, Any] = Field(default_factory=dict)


class TelemetryEventsRequest(BaseModel):
    events: list[TelemetryEvent]


class TelemetryEventsResponse(BaseModel):
    received: int
    stored: int = 0
    rejected: int = 0


class TelemetryReportResponse(BaseModel):
    period: dict[str, str]
    metrics: dict[str, list[dict[str, Any]]]
