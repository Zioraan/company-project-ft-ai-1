"""Telemetry ingest and report routes."""

from __future__ import annotations

import logging
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import ValidationError
from sqlmodel import Session

from app.core.database import get_db
from app.schemas.telemetry import TelemetryEvent, TelemetryEventsResponse, TelemetryReportResponse
from app.store import telemetry_store
from domain.telemetry_analysis import (
    assignment_failure_rate_per_day,
    assignments_per_day_by_office,
    auth_failure_rate,
)

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

logger = logging.getLogger(__name__)

REPORT_CACHE_TTL_SECONDS = 60
_report_cache: dict[tuple[str, str], tuple[float, dict[str, Any]]] = {}


def clear_report_cache() -> None:
    """Test helper to reset the in-memory report cache."""
    _report_cache.clear()


def _as_utc_day_start(value: date) -> datetime:
    return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)


def _resolve_report_window(
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime, datetime, str, str]:
    """Inclusive start / exclusive end. Default: last 7 days ending today (UTC)."""
    today = datetime.now(timezone.utc).date()
    resolved_end = end_date or today
    resolved_start = start_date or (resolved_end - timedelta(days=7))
    if resolved_start >= resolved_end:
        raise HTTPException(
            status_code=422,
            detail="start_date must be earlier than end_date.",
        )
    return (
        _as_utc_day_start(resolved_start),
        _as_utc_day_start(resolved_end),
        resolved_start.isoformat(),
        resolved_end.isoformat(),
    )


def _build_report(
    session: Session,
    start_dt: datetime,
    end_dt: datetime,
) -> dict[str, list[dict[str, Any]]]:
    return {
        "assignments_per_day_by_office": assignments_per_day_by_office(
            session, start_dt, end_dt
        ),
        "assignment_failure_rate_per_day": assignment_failure_rate_per_day(
            session, start_dt, end_dt
        ),
        "auth_failure_rate": auth_failure_rate(session, start_dt, end_dt),
    }


@router.post("/events", response_model=TelemetryEventsResponse)
def ingest_events_route(
    payload: dict[str, Any] = Body(...),
    session: Session = Depends(get_db),
) -> TelemetryEventsResponse:
    """Accept a batch, validate per-event, bulk-insert valid rows only."""
    raw_events = payload.get("events")
    if not isinstance(raw_events, list):
        raise HTTPException(
            status_code=422,
            detail="Request body must include an 'events' array.",
        )

    valid_events: list[TelemetryEvent] = []
    rejected = 0
    for item in raw_events:
        try:
            valid_events.append(TelemetryEvent.model_validate(item))
        except ValidationError:
            rejected += 1

    stored = telemetry_store.bulk_insert_events(session, valid_events)
    logger.info(
        "Telemetry ingest received=%s stored=%s rejected=%s types=%s",
        len(raw_events),
        stored,
        rejected,
        [event.event_type for event in valid_events],
    )
    return TelemetryEventsResponse(
        received=len(raw_events),
        stored=stored,
        rejected=rejected,
    )


@router.get("/report", response_model=TelemetryReportResponse)
def telemetry_report_route(
    session: Session = Depends(get_db),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> TelemetryReportResponse:
    """Return KPI metrics for the resolved UTC date window (cached 60s)."""
    start_dt, end_dt, period_from, period_to = _resolve_report_window(
        start_date, end_date
    )
    cache_key = (period_from, period_to)
    cached = _report_cache.get(cache_key)
    now = time.monotonic()
    if cached is not None and now - cached[0] < REPORT_CACHE_TTL_SECONDS:
        return TelemetryReportResponse(
            period={"from": period_from, "to": period_to},
            metrics=cached[1],
        )

    metrics = _build_report(session, start_dt, end_dt)
    _report_cache[cache_key] = (now, metrics)
    return TelemetryReportResponse(
        period={"from": period_from, "to": period_to},
        metrics=metrics,
    )
