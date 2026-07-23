"""Persistence helpers for weekly office/programme performance reporting."""

from __future__ import annotations

from datetime import date, datetime, timezone

from sqlmodel import Session, select

from app.models.reporting import WeeklyOfficeProgramPerformance
from domain.weekly_office_program_performance import (
    WeeklyPerformanceRow,
    compute_weekly_performance_for_window,
    week_window_utc,
)


def upsert_weekly_rows(
    session: Session,
    rows: list[WeeklyPerformanceRow],
) -> int:
    """Upsert by (office, programme_id, week_start). Returns rows written."""
    now = datetime.now(timezone.utc)
    written = 0
    for row in rows:
        existing = session.exec(
            select(WeeklyOfficeProgramPerformance).where(
                WeeklyOfficeProgramPerformance.office == row.office,
                WeeklyOfficeProgramPerformance.programme_id == row.programme_id,
                WeeklyOfficeProgramPerformance.week_start == row.week_start,
            )
        ).first()
        if existing is None:
            session.add(
                WeeklyOfficeProgramPerformance(
                    office=row.office,
                    programme_id=row.programme_id,
                    week_start=row.week_start,
                    total_material_cost=row.total_material_cost,
                    kits_delivered_count=row.kits_delivered_count,
                    shortage_events_count=row.shortage_events_count,
                    cost_variance_events_count=row.cost_variance_events_count,
                    currency=row.currency,
                    computed_at=now,
                )
            )
        else:
            existing.total_material_cost = row.total_material_cost
            existing.kits_delivered_count = row.kits_delivered_count
            existing.shortage_events_count = row.shortage_events_count
            existing.cost_variance_events_count = row.cost_variance_events_count
            existing.currency = row.currency
            existing.computed_at = now
            session.add(existing)
        written += 1
    session.commit()
    return written


def compute_and_upsert_week(
    session: Session,
    week_start: date,
) -> tuple[list[WeeklyPerformanceRow], int]:
    window_start, window_end = week_window_utc(week_start)
    rows = compute_weekly_performance_for_window(
        session,
        window_start=window_start,
        window_end=window_end,
    )
    # Keep only rows for the requested week_start (aggregation groups by event weeks)
    focused = [row for row in rows if row.week_start == week_start]
    loaded = upsert_weekly_rows(session, focused)
    return focused, loaded


def latest_week_start(session: Session) -> date | None:
    rows = session.exec(
        select(WeeklyOfficeProgramPerformance.week_start)
        .order_by(WeeklyOfficeProgramPerformance.week_start.desc())
    ).all()
    return rows[0] if rows else None


def list_entries_for_week(
    session: Session,
    week_start: date,
) -> list[WeeklyOfficeProgramPerformance]:
    return list(
        session.exec(
            select(WeeklyOfficeProgramPerformance)
            .where(WeeklyOfficeProgramPerformance.week_start == week_start)
            .order_by(
                WeeklyOfficeProgramPerformance.office,
                WeeklyOfficeProgramPerformance.programme_id,
            )
        ).all()
    )
