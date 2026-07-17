"""Reporting API routes for Weekly Office & Programme Performance."""

from __future__ import annotations

import importlib.util
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.reporting import (
    ComputeWeeklyPerformanceRequest,
    ComputeWeeklyPerformanceResponse,
    PipelineRunDataSchema,
    PipelineRunEnvelopeSchema,
    PipelineRunTriggerRequest,
    WeeklyPerformanceEntrySchema,
    WeeklyPerformanceResponseSchema,
)
from app.schemas.users import UserResponseSchema
from app.store import pipeline_runs_store, reporting_store
from domain.weekly_office_program_performance import iso_week_start_utc

router = APIRouter(
    prefix="/reporting",
    tags=["reporting"],
    dependencies=[Depends(get_current_user)],
)

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[UserResponseSchema, Depends(get_current_user)]

_PIPELINE_MODULE = None


def _load_pipeline_module():
    global _PIPELINE_MODULE
    if _PIPELINE_MODULE is not None:
        return _PIPELINE_MODULE

    # services/api/app/routers/reporting.py -> repo root is parents[4]
    root = Path(__file__).resolve().parents[4]
    pipeline_path = root / "data" / "pipelines" / "pipeline.py"
    if not pipeline_path.exists():
        # Fallback: services/api as cwd and data mounted at /data
        for candidate_root in (
            Path.cwd(),
            Path.cwd().parent,
            Path("/"),
        ):
            candidate = candidate_root / "data" / "pipelines" / "pipeline.py"
            if candidate.exists():
                root = candidate_root
                pipeline_path = candidate
                break

    if not pipeline_path.exists():
        raise RuntimeError("data/pipelines/pipeline.py not found")

    api_dir = root / "services" / "api"
    if api_dir.exists() and str(api_dir) not in sys.path:
        sys.path.insert(0, str(api_dir))
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    spec = importlib.util.spec_from_file_location(
        "nexova_weekly_pipeline",
        pipeline_path,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load pipeline module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    _PIPELINE_MODULE = module
    return module


def _default_week_start() -> date:
    return iso_week_start_utc(datetime.now(timezone.utc))


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _run_to_schema(row) -> PipelineRunDataSchema:
    return PipelineRunDataSchema(
        run_id=row.run_id,
        flow_name=row.flow_name,
        trigger_mode=row.trigger_mode,
        status=row.status,
        source_window_start=row.source_window_start,
        source_window_end=row.source_window_end,
        started_at=row.started_at,
        ended_at=row.ended_at,
        records_extracted=row.records_extracted,
        records_loaded=row.records_loaded,
        error_count=row.error_count,
        error_summary=row.error_summary,
    )


@router.get(
    "/weekly-office-program-performance",
    response_model=WeeklyPerformanceResponseSchema,
)
def get_weekly_office_program_performance(
    session: DbSession,
    week_start: date | None = None,
) -> WeeklyPerformanceResponseSchema:
    target = week_start or reporting_store.latest_week_start(session)
    if target is None:
        raise HTTPException(
            status_code=404,
            detail="No weekly performance rows found. Compute a week first.",
        )
    rows = reporting_store.list_entries_for_week(session, target)
    return WeeklyPerformanceResponseSchema(
        week_start=target,
        entries=[
            WeeklyPerformanceEntrySchema(
                office=row.office,
                programme_id=row.programme_id,
                total_material_cost=row.total_material_cost,
                kits_delivered_count=row.kits_delivered_count,
                shortage_events_count=row.shortage_events_count,
                cost_variance_events_count=row.cost_variance_events_count,
                currency=row.currency,
            )
            for row in rows
        ],
    )


@router.post(
    "/weekly-office-program-performance/compute",
    response_model=ComputeWeeklyPerformanceResponse,
)
def compute_weekly_office_program_performance(
    session: DbSession,
    _current_user: CurrentUser,
    payload: ComputeWeeklyPerformanceRequest | None = None,
) -> ComputeWeeklyPerformanceResponse:
    body = payload or ComputeWeeklyPerformanceRequest()
    week_start = body.week_start or _default_week_start()
    if week_start.weekday() != 0:
        week_start = week_start - timedelta(days=week_start.weekday())
    _rows, loaded = reporting_store.compute_and_upsert_week(session, week_start)
    computed_at = datetime.now(timezone.utc)
    stored = reporting_store.list_entries_for_week(session, week_start)
    if stored:
        computed_at = stored[0].computed_at
    return ComputeWeeklyPerformanceResponse(
        week_start=week_start,
        records_loaded=loaded,
        computed_at=computed_at,
    )


@router.get(
    "/pipeline-runs/latest",
    response_model=PipelineRunEnvelopeSchema,
)
def get_latest_pipeline_run(session: DbSession) -> PipelineRunEnvelopeSchema:
    row = pipeline_runs_store.latest_run(session)
    if row is None:
        raise HTTPException(status_code=404, detail="No pipeline runs found.")
    return PipelineRunEnvelopeSchema(data=_run_to_schema(row))


@router.post(
    "/pipeline-runs",
    response_model=PipelineRunEnvelopeSchema,
    status_code=200,
)
def trigger_pipeline_run(
    payload: PipelineRunTriggerRequest,
    session: DbSession,
    _current_user: CurrentUser,
) -> PipelineRunEnvelopeSchema:
    start = _as_utc(payload.source_window_start)
    end = _as_utc(payload.source_window_end)
    if start >= end:
        raise HTTPException(
            status_code=422,
            detail="source_window_start must be before source_window_end.",
        )

    existing = pipeline_runs_store.find_running_for_window(
        session,
        flow_name="weekly_office_program_performance_flow",
        source_window_start=start,
        source_window_end=end,
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="A pipeline run is already in progress for this window.",
        )

    run_id = str(uuid4())
    pipeline = _load_pipeline_module()
    try:
        pipeline.run_pipeline_window(
            source_window_start=start,
            source_window_end=end,
            trigger_mode=payload.trigger_mode or "manual",
            run_id=run_id,
        )
    except Exception as exc:  # noqa: BLE001
        row = pipeline_runs_store.get_run(session, run_id)
        if row is None:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        return PipelineRunEnvelopeSchema(data=_run_to_schema(row))

    # Refresh session after pipeline opened its own sessions
    session.expire_all()
    row = pipeline_runs_store.get_run(session, run_id)
    if row is None:
        raise HTTPException(
            status_code=500,
            detail="Pipeline finished but run metadata was not found.",
        )
    return PipelineRunEnvelopeSchema(data=_run_to_schema(row))
