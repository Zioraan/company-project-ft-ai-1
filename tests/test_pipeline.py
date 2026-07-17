"""Tests for Prefect pipeline CLI and reporting pipeline-run endpoints."""

from __future__ import annotations

import importlib.util
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.database import get_engine
from app.models.reporting import WeeklyOfficeProgramPerformance
from app.schemas.telemetry import TelemetryEvent
from app.store import telemetry_store

ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / "data" / "pipelines" / "pipeline.py"


def _load_pipeline():
    spec = importlib.util.spec_from_file_location("pipeline_under_test", PIPELINE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _seed(session: Session) -> None:
    events = [
        TelemetryEvent(
            eventId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01",
            timestamp="2026-07-14T10:00:00.000Z",
            sessionId="sess",
            userId="user",
            event_type="inbound_order_created",
            schemaVersion="1.0.0",
            requestId="req-1",
            properties={
                "office": "valencia",
                "programme_id": "b2b-sales",
                "product_id": 1,
                "product_category": "training_kit",
                "quantity": 2,
                "currency": "EUR",
                "unit_cost": 40.0,
            },
        ),
        TelemetryEvent(
            eventId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02",
            timestamp="2026-07-14T12:00:00.000Z",
            sessionId="sess",
            userId="user",
            event_type="outbound_order_created",
            schemaVersion="1.0.0",
            requestId="req-2",
            properties={
                "office": "valencia",
                "programme_id": "b2b-sales",
                "product_id": 1,
                "product_category": "training_kit",
                "quantity": 1,
                "currency": "EUR",
            },
        ),
    ]
    telemetry_store.bulk_insert_events(session, events)


def test_pipeline_module_prefect_patterns() -> None:
    module = _load_pipeline()
    extract = module.extract_telemetry_events_task
    transform = module.transform_telemetry_kpis_task
    assert getattr(extract, "retries", None) == 2
    cache_key_fn = getattr(transform, "cache_key_fn", None)
    assert cache_key_fn is not None
    assert module.notify_pipeline_failure_task is not None


def test_pipeline_cli_entrypoint_runs(tmp_path: Path) -> None:
    # Ensure CLI imports cleanly and exits 0 against empty/available DB
    env = {
        **dict(**{k: v for k, v in __import__("os").environ.items()}),
        "JWT_SECRET_KEY": "test-secret-key-for-pytest",
        "DATABASE_URL": f"sqlite:///{tmp_path / 'pipeline-cli.db'}",
    }
    completed = subprocess.run(
        [
            sys.executable,
            str(PIPELINE),
            "--start",
            "2026-07-13T00:00:00Z",
            "--end",
            "2026-07-20T00:00:00Z",
        ],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode == 0, completed.stderr
    assert "completed" in completed.stdout or "run_id" in completed.stdout


def test_manual_pipeline_trigger_and_latest(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    with Session(get_engine()) as session:
        _seed(session)

    assert client.get("/reporting/pipeline-runs/latest").status_code == 401

    empty = client.get(
        "/reporting/pipeline-runs/latest",
        headers=auth_headers,
    )
    assert empty.status_code == 404

    bad = client.post(
        "/reporting/pipeline-runs",
        json={
            "trigger_mode": "manual",
            "source_window_start": "2026-07-20T00:00:00Z",
            "source_window_end": "2026-07-13T00:00:00Z",
        },
        headers=auth_headers,
    )
    assert bad.status_code == 422

    response = client.post(
        "/reporting/pipeline-runs",
        json={
            "trigger_mode": "manual",
            "source_window_start": "2026-07-13T00:00:00Z",
            "source_window_end": "2026-07-20T00:00:00Z",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "completed"
    assert data["flow_name"] == "weekly_office_program_performance_flow"
    assert data["records_extracted"] >= 2
    assert data["records_loaded"] >= 1

    latest = client.get(
        "/reporting/pipeline-runs/latest",
        headers=auth_headers,
    )
    assert latest.status_code == 200
    assert latest.json()["data"]["run_id"] == data["run_id"]

    # Idempotent second run — still one reporting row for grain
    second = client.post(
        "/reporting/pipeline-runs",
        json={
            "trigger_mode": "manual",
            "source_window_start": "2026-07-13T00:00:00Z",
            "source_window_end": "2026-07-20T00:00:00Z",
        },
        headers=auth_headers,
    )
    assert second.status_code == 200
    assert second.json()["data"]["status"] == "completed"

    with Session(get_engine()) as session:
        rows = session.exec(select(WeeklyOfficeProgramPerformance)).all()
        assert len(rows) == 1
        assert rows[0].total_material_cost == 80.0
        assert rows[0].kits_delivered_count == 1
