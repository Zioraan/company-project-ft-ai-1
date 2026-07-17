"""Store helpers for telemetry pipeline runs."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models.pipeline_runs import TelemetryPipelineRun


def create_run(
    session: Session,
    *,
    run_id: str,
    flow_name: str,
    trigger_mode: str,
    source_window_start: datetime,
    source_window_end: datetime,
) -> TelemetryPipelineRun:
    row = TelemetryPipelineRun(
        run_id=run_id,
        flow_name=flow_name,
        trigger_mode=trigger_mode,
        status="running",
        source_window_start=source_window_start,
        source_window_end=source_window_end,
        started_at=datetime.now(timezone.utc),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def find_running_for_window(
    session: Session,
    *,
    flow_name: str,
    source_window_start: datetime,
    source_window_end: datetime,
) -> TelemetryPipelineRun | None:
    return session.exec(
        select(TelemetryPipelineRun).where(
            TelemetryPipelineRun.flow_name == flow_name,
            TelemetryPipelineRun.status == "running",
            TelemetryPipelineRun.source_window_start == source_window_start,
            TelemetryPipelineRun.source_window_end == source_window_end,
        )
    ).first()


def finalize_run(
    session: Session,
    *,
    run_id: str,
    status: str,
    records_extracted: int = 0,
    records_loaded: int = 0,
    error_count: int = 0,
    error_summary: str | None = None,
) -> TelemetryPipelineRun | None:
    row = session.exec(
        select(TelemetryPipelineRun).where(TelemetryPipelineRun.run_id == run_id)
    ).first()
    if row is None:
        return None
    row.status = status
    row.ended_at = datetime.now(timezone.utc)
    row.records_extracted = records_extracted
    row.records_loaded = records_loaded
    row.error_count = error_count
    row.error_summary = error_summary
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def latest_run(session: Session) -> TelemetryPipelineRun | None:
    return session.exec(
        select(TelemetryPipelineRun).order_by(
            TelemetryPipelineRun.started_at.desc()
        )
    ).first()


def get_run(session: Session, run_id: str) -> TelemetryPipelineRun | None:
    return session.exec(
        select(TelemetryPipelineRun).where(TelemetryPipelineRun.run_id == run_id)
    ).first()
