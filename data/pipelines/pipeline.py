"""Prefect pipeline: Weekly Office & Programme Performance ETL."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

ROOT_DIR = Path(__file__).resolve().parents[2]
API_DIR = ROOT_DIR / "services" / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from prefect import flow, task  # noqa: E402
from prefect.tasks import task_input_hash  # noqa: E402
from sqlmodel import Session  # noqa: E402

from app.core.database import get_engine, init_inventory_db  # noqa: E402
from app.store import pipeline_runs_store, reporting_store  # noqa: E402
from domain.weekly_office_program_performance import (  # noqa: E402
    aggregate_weekly_performance,
    load_business_events,
)

FLOW_NAME = "weekly_office_program_performance_flow"


def _parse_iso(value: str) -> datetime:
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


@task(retries=2, retry_delay_seconds=1)
def record_pipeline_run_start_task(
    *,
    run_id: str,
    trigger_mode: str,
    source_window_start: datetime,
    source_window_end: datetime,
) -> str:
    init_inventory_db()
    with Session(get_engine()) as session:
        pipeline_runs_store.create_run(
            session,
            run_id=run_id,
            flow_name=FLOW_NAME,
            trigger_mode=trigger_mode,
            source_window_start=source_window_start,
            source_window_end=source_window_end,
        )
    return run_id


@task(retries=2, retry_delay_seconds=1)
def extract_telemetry_events_task(
    source_window_start: datetime,
    source_window_end: datetime,
) -> list[dict]:
    """Extract business-metric telemetry for the window (retried external/DB task)."""
    init_inventory_db()
    with Session(get_engine()) as session:
        rows = load_business_events(
            session,
            window_start=source_window_start,
            window_end=source_window_end,
        )
        return [
            {
                "event_type": row.event_type,
                "timestamp": row.timestamp.isoformat(),
                "tags": dict(row.tags or {}),
            }
            for row in rows
        ]


@task(
    cache_key_fn=task_input_hash,
    cache_expiration=timedelta(minutes=10),
)
def transform_telemetry_kpis_task(raw_events: list[dict]) -> list[dict]:
    """Transform extracted events into weekly KPI rows (cached)."""
    from app.models.telemetry import TelemetryEventRecord

    records: list[TelemetryEventRecord] = []
    for index, item in enumerate(raw_events):
        ts = _parse_iso(item["timestamp"])
        records.append(
            TelemetryEventRecord(
                event_id=f"pipeline-{index}",
                timestamp=ts,
                event_type=item["event_type"],
                service="pipeline",
                session_id="pipeline",
                user_id="pipeline",
                request_id=f"pipeline-{index}",
                schema_version="1.0.0",
                tags=item.get("tags") or {},
            )
        )
    rows = aggregate_weekly_performance(records)
    return [row.to_dict() for row in rows]


@task
def load_weekly_office_program_performance_task(kpi_rows: list[dict]) -> int:
    """Idempotent upsert load into weekly_office_program_performance."""
    from domain.weekly_office_program_performance import WeeklyPerformanceRow

    init_inventory_db()
    normalized = [
        WeeklyPerformanceRow(
            office=item["office"],
            programme_id=item["programme_id"],
            week_start=date_from_value(item["week_start"]),
            total_material_cost=float(item["total_material_cost"]),
            kits_delivered_count=int(item["kits_delivered_count"]),
            shortage_events_count=int(item["shortage_events_count"]),
            cost_variance_events_count=int(item["cost_variance_events_count"]),
            currency=item["currency"],
        )
        for item in kpi_rows
    ]
    with Session(get_engine()) as session:
        return reporting_store.upsert_weekly_rows(session, normalized)


def date_from_value(value: str):
    from datetime import date

    if "T" in value:
        return _parse_iso(value).date()
    return date.fromisoformat(value)


@task
def record_pipeline_run_finish_task(
    *,
    run_id: str,
    status: str,
    records_extracted: int,
    records_loaded: int,
    error_count: int = 0,
    error_summary: str | None = None,
) -> str:
    with Session(get_engine()) as session:
        pipeline_runs_store.finalize_run(
            session,
            run_id=run_id,
            status=status,
            records_extracted=records_extracted,
            records_loaded=records_loaded,
            error_count=error_count,
            error_summary=error_summary,
        )
    return status


@task
def notify_pipeline_failure_task(status: str, error_summary: str | None) -> str:
    """Optional notification hook (invoked with return_state=True)."""
    if status == "failed":
        return f"pipeline_failed:{error_summary or 'unknown'}"
    return "pipeline_ok"


@flow(name=FLOW_NAME)
def weekly_office_program_performance_flow(
    source_window_start: datetime,
    source_window_end: datetime,
    trigger_mode: str = "manual",
    run_id: str | None = None,
) -> dict:
    active_run_id = run_id or str(uuid4())
    record_pipeline_run_start_task(
        run_id=active_run_id,
        trigger_mode=trigger_mode,
        source_window_start=source_window_start,
        source_window_end=source_window_end,
    )

    records_extracted = 0
    records_loaded = 0
    try:
        raw_events = extract_telemetry_events_task(
            source_window_start,
            source_window_end,
        )
        records_extracted = len(raw_events)
        kpi_rows = transform_telemetry_kpis_task(raw_events)
        records_loaded = load_weekly_office_program_performance_task(kpi_rows)
        status = record_pipeline_run_finish_task(
            run_id=active_run_id,
            status="completed",
            records_extracted=records_extracted,
            records_loaded=records_loaded,
        )
        notify_pipeline_failure_task(status, None, return_state=True)
        return {
            "run_id": active_run_id,
            "flow_name": FLOW_NAME,
            "trigger_mode": trigger_mode,
            "status": "completed",
            "records_extracted": records_extracted,
            "records_loaded": records_loaded,
        }
    except Exception as exc:  # noqa: BLE001 — persist failure metadata
        record_pipeline_run_finish_task(
            run_id=active_run_id,
            status="failed",
            records_extracted=records_extracted,
            records_loaded=records_loaded,
            error_count=1,
            error_summary=str(exc),
        )
        notify_pipeline_failure_task("failed", str(exc), return_state=True)
        raise


def run_pipeline_window(
    *,
    source_window_start: datetime,
    source_window_end: datetime,
    trigger_mode: str = "manual",
    run_id: str | None = None,
) -> dict:
    """Callable entry used by API routers (no Prefect CLI required)."""
    return weekly_office_program_performance_flow(
        source_window_start=source_window_start,
        source_window_end=source_window_end,
        trigger_mode=trigger_mode,
        run_id=run_id,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run Weekly Office & Programme Performance pipeline"
    )
    parser.add_argument("--start", required=True, help="ISO window start (UTC)")
    parser.add_argument("--end", required=True, help="ISO window end (UTC, exclusive)")
    parser.add_argument("--trigger-mode", default="manual")
    args = parser.parse_args(argv)

    start = _parse_iso(args.start)
    end = _parse_iso(args.end)
    if start >= end:
        raise SystemExit("source_window_start must be before source_window_end")

    result = run_pipeline_window(
        source_window_start=start,
        source_window_end=end,
        trigger_mode=args.trigger_mode,
    )
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
