"""Telemetry KPI analysis: SQL load + Pandas refine/group/aggregate."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd
from sqlmodel import Session, col, select

from app.models.telemetry import TelemetryEventRecord


def _load_events(
    session: Session,
    start_date: datetime,
    end_date: datetime,
    event_types: list[str],
) -> pd.DataFrame:
    """Load filtered telemetry rows. Date window is inclusive start, exclusive end (UTC)."""
    statement = (
        select(TelemetryEventRecord)
        .where(TelemetryEventRecord.timestamp >= start_date)
        .where(TelemetryEventRecord.timestamp < end_date)
        .where(col(TelemetryEventRecord.event_type).in_(event_types))
    )
    rows = session.exec(statement).all()
    if not rows:
        return pd.DataFrame(
            columns=["id", "timestamp", "event_type", "tags"],
        )

    frame = pd.DataFrame(
        [
            {
                "id": row.id,
                "timestamp": row.timestamp,
                "event_type": row.event_type,
                "tags": row.tags or {},
            }
            for row in rows
        ]
    )
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True)
    return frame


def _office_series(tags: pd.Series) -> pd.Series:
    return tags.map(
        lambda value: value.get("office") if isinstance(value, dict) else None
    )


def assignments_per_day_by_office(
    session: Session,
    start_date: datetime,
    end_date: datetime,
) -> list[dict[str, Any]]:
    """Count assignment_order_created events per day and office."""
    frame = _load_events(
        session,
        start_date,
        end_date,
        ["assignment_order_created"],
    )
    if frame.empty:
        return []

    frame = frame.copy()
    frame["date"] = frame["timestamp"].dt.strftime("%Y-%m-%d")
    frame["office"] = _office_series(frame["tags"])
    frame = frame.dropna(subset=["office"])
    if frame.empty:
        return []

    grouped = (
        frame.groupby(["date", "office"], as_index=False)["id"]
        .count()
        .rename(columns={"id": "count"})
        .sort_values(["date", "office"])
    )
    return grouped.to_dict(orient="records")


def assignment_failure_rate_per_day(
    session: Session,
    start_date: datetime,
    end_date: datetime,
) -> list[dict[str, Any]]:
    """Daily assignment failure rate from created + failed events."""
    frame = _load_events(
        session,
        start_date,
        end_date,
        ["assignment_order_created", "assignment_order_failed"],
    )
    if frame.empty:
        return []

    frame = frame.copy()
    frame["date"] = frame["timestamp"].dt.strftime("%Y-%m-%d")
    frame["is_failure"] = frame["event_type"] == "assignment_order_failed"

    grouped = (
        frame.groupby("date", as_index=False)
        .agg(total=("id", "count"), failures=("is_failure", "sum"))
        .sort_values("date")
    )
    grouped["failure_rate"] = grouped["failures"] / grouped["total"]
    grouped["failures"] = grouped["failures"].astype(int)
    grouped["total"] = grouped["total"].astype(int)
    return grouped.to_dict(orient="records")


def auth_failure_rate(
    session: Session,
    start_date: datetime,
    end_date: datetime,
) -> list[dict[str, Any]]:
    """Daily auth failure rate, segmented by office when present in tags."""
    frame = _load_events(
        session,
        start_date,
        end_date,
        ["user_login_succeeded", "user_login_failed"],
    )
    if frame.empty:
        return []

    frame = frame.copy()
    frame["date"] = frame["timestamp"].dt.strftime("%Y-%m-%d")
    frame["office"] = _office_series(frame["tags"])
    frame = frame.dropna(subset=["office"])
    if frame.empty:
        return []

    frame["is_failure"] = frame["event_type"] == "user_login_failed"
    grouped = (
        frame.groupby(["date", "office"], as_index=False)
        .agg(total=("id", "count"), failures=("is_failure", "sum"))
        .sort_values(["date", "office"])
    )
    grouped["failure_rate"] = grouped["failures"] / grouped["total"]
    grouped["failures"] = grouped["failures"].astype(int)
    grouped["total"] = grouped["total"].astype(int)
    return grouped.to_dict(orient="records")
