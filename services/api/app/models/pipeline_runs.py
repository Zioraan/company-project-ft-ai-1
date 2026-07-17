"""Pipeline run metadata SQLModel table."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid_str() -> str:
    return str(uuid4())


class TelemetryPipelineRun(SQLModel, table=True):
    __tablename__ = "telemetry_pipeline_runs"

    id: str = Field(default_factory=_uuid_str, primary_key=True)
    run_id: str = Field(unique=True, index=True)
    flow_name: str = Field(index=True)
    trigger_mode: str = Field(default="manual")
    status: str = Field(default="running", index=True)
    source_window_start: datetime
    source_window_end: datetime
    started_at: datetime = Field(default_factory=_utc_now, index=True)
    ended_at: datetime | None = None
    records_extracted: int = Field(default=0)
    records_loaded: int = Field(default=0)
    error_count: int = Field(default=0)
    error_summary: str | None = None
    created_at: datetime = Field(default_factory=_utc_now)
