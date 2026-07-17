"""Reporting SQLModel tables for weekly office/programme performance."""

from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

from sqlmodel import Field, SQLModel, UniqueConstraint


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid_str() -> str:
    return str(uuid4())


class WeeklyOfficeProgramPerformance(SQLModel, table=True):
    __tablename__ = "weekly_office_program_performance"
    __table_args__ = (
        UniqueConstraint(
            "office",
            "programme_id",
            "week_start",
            name="uq_weekly_office_program_performance",
        ),
    )

    id: str = Field(default_factory=_uuid_str, primary_key=True)
    office: str = Field(index=True)
    programme_id: str = Field(index=True)
    week_start: date = Field(index=True)
    total_material_cost: float = Field(default=0.0)
    kits_delivered_count: int = Field(default=0)
    shortage_events_count: int = Field(default=0)
    cost_variance_events_count: int = Field(default=0)
    currency: str
    computed_at: datetime = Field(default_factory=_utc_now)
