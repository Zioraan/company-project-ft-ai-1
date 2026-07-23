"""
Reporting boundary (`services/reporting/`).

FastAPI routes are registered from `app.routers.reporting` in the platform API.
Domain KPI aggregation lives in `domain.weekly_office_program_performance`.
Store/upsert helpers live in `app.store.reporting_store`.

This package is the architectural boundary for reporting consumers and Phase 3
pipeline imports of reporting orchestration helpers.
"""

from __future__ import annotations

from datetime import date

from sqlmodel import Session

# Re-exported orchestration for pipeline / external callers once API path is loadable.
def compute_week(session: Session, week_start: date) -> tuple[list, int]:
    from app.store.reporting_store import compute_and_upsert_week

    return compute_and_upsert_week(session, week_start)


def get_weekly_entries(session: Session, week_start: date) -> list:
    from app.store.reporting_store import list_entries_for_week

    return list_entries_for_week(session, week_start)


__all__ = ["compute_week", "get_weekly_entries"]
