"""SQLModel table for immutable telemetry event storage."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class TelemetryEventRecord(SQLModel, table=True):
    """Persisted telemetry row. Envelope properties are stored in `tags`."""

    __tablename__ = "telemetry_events"
    __table_args__ = (
        Index("ix_telemetry_events_timestamp", "timestamp"),
        Index("ix_telemetry_events_event_type", "event_type"),
        Index("ix_telemetry_events_service", "service"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(index=True, max_length=64)
    timestamp: datetime
    event_type: str = Field(max_length=128)
    service: str = Field(max_length=64)
    session_id: str = Field(max_length=64)
    user_id: str = Field(max_length=64)
    request_id: str = Field(max_length=64)
    schema_version: str = Field(max_length=32)
    tags: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(
            JSON().with_variant(JSONB(), "postgresql"),
            nullable=False,
            server_default=text("'{}'"),
        ),
    )
