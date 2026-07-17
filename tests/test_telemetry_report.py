"""Tests for Phase 2C telemetry report metrics and cache."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.database import get_engine
from app.models.telemetry import TelemetryEventRecord
from app.routers import telemetry as telemetry_router
from domain.telemetry_analysis import (
    assignment_failure_rate_per_day,
    assignments_per_day_by_office,
    auth_failure_rate,
)


def _seed_row(
    *,
    event_id: str,
    event_type: str,
    timestamp: datetime,
    tags: dict,
) -> TelemetryEventRecord:
    return TelemetryEventRecord(
        event_id=event_id,
        timestamp=timestamp,
        event_type=event_type,
        service="backoffice",
        session_id="session-1",
        user_id="user-1",
        request_id=f"req-{event_id}",
        schema_version="1.0.0",
        tags=tags,
    )


def _seed_report_fixture() -> None:
    rows = [
        _seed_row(
            event_id="a1",
            event_type="assignment_order_created",
            timestamp=datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc),
            tags={"office": "valencia", "asset_category": "hardware"},
        ),
        _seed_row(
            event_id="a2",
            event_type="assignment_order_created",
            timestamp=datetime(2026, 7, 10, 15, 0, tzinfo=timezone.utc),
            tags={"office": "miami", "asset_category": "peripheral"},
        ),
        _seed_row(
            event_id="a3",
            event_type="assignment_order_created",
            timestamp=datetime(2026, 7, 10, 16, 0, tzinfo=timezone.utc),
            tags={"office": "valencia", "asset_category": "hardware"},
        ),
        _seed_row(
            event_id="f1",
            event_type="assignment_order_failed",
            timestamp=datetime(2026, 7, 10, 18, 0, tzinfo=timezone.utc),
            tags={"office": "valencia", "failure_reason": "insufficient_stock"},
        ),
        _seed_row(
            event_id="a4",
            event_type="assignment_order_created",
            timestamp=datetime(2026, 7, 11, 9, 0, tzinfo=timezone.utc),
            tags={"office": "miami", "asset_category": "consumable"},
        ),
        _seed_row(
            event_id="login-ok",
            event_type="user_login_succeeded",
            timestamp=datetime(2026, 7, 10, 8, 0, tzinfo=timezone.utc),
            tags={"office": "valencia"},
        ),
        _seed_row(
            event_id="login-fail",
            event_type="user_login_failed",
            timestamp=datetime(2026, 7, 10, 8, 30, tzinfo=timezone.utc),
            tags={"office": "valencia", "failure_reason": "invalid_credentials"},
        ),
        _seed_row(
            event_id="outside",
            event_type="assignment_order_created",
            timestamp=datetime(2026, 7, 1, 12, 0, tzinfo=timezone.utc),
            tags={"office": "miami"},
        ),
        _seed_row(
            event_id="no-office",
            event_type="assignment_order_created",
            timestamp=datetime(2026, 7, 10, 20, 0, tzinfo=timezone.utc),
            tags={},
        ),
    ]
    with Session(get_engine()) as session:
        session.add_all(rows)
        session.commit()


def test_assignments_per_day_by_office_groups_dimensions() -> None:
    _seed_report_fixture()
    start = datetime(2026, 7, 10, tzinfo=timezone.utc)
    end = datetime(2026, 7, 12, tzinfo=timezone.utc)
    with Session(get_engine()) as session:
        result = assignments_per_day_by_office(session, start, end)

    assert result == [
        {"date": "2026-07-10", "office": "miami", "count": 1},
        {"date": "2026-07-10", "office": "valencia", "count": 2},
        {"date": "2026-07-11", "office": "miami", "count": 1},
    ]


def test_assignment_failure_rate_per_day() -> None:
    _seed_report_fixture()
    start = datetime(2026, 7, 10, tzinfo=timezone.utc)
    end = datetime(2026, 7, 12, tzinfo=timezone.utc)
    with Session(get_engine()) as session:
        result = assignment_failure_rate_per_day(session, start, end)

    by_date = {row["date"]: row for row in result}
    assert by_date["2026-07-10"]["total"] == 5  # 4 created + 1 failed
    assert by_date["2026-07-10"]["failures"] == 1
    assert by_date["2026-07-10"]["failure_rate"] == 0.2
    assert by_date["2026-07-11"]["total"] == 1
    assert by_date["2026-07-11"]["failures"] == 0
    assert by_date["2026-07-11"]["failure_rate"] == 0.0


def test_auth_failure_rate_by_office_drops_null_office() -> None:
    _seed_report_fixture()
    start = datetime(2026, 7, 10, tzinfo=timezone.utc)
    end = datetime(2026, 7, 12, tzinfo=timezone.utc)
    with Session(get_engine()) as session:
        result = auth_failure_rate(session, start, end)

    assert result == [
        {
            "date": "2026-07-10",
            "office": "valencia",
            "total": 2,
            "failures": 1,
            "failure_rate": 0.5,
        }
    ]


def test_report_endpoint_custom_range(client: TestClient) -> None:
    _seed_report_fixture()
    telemetry_router.clear_report_cache()
    response = client.get(
        "/telemetry/report",
        params={"start_date": "2026-07-10", "end_date": "2026-07-12"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["period"] == {"from": "2026-07-10", "to": "2026-07-12"}
    assert "assignments_per_day_by_office" in payload["metrics"]
    assert "assignment_failure_rate_per_day" in payload["metrics"]
    assert "auth_failure_rate" in payload["metrics"]
    assert payload["metrics"]["assignments_per_day_by_office"][0]["office"] in {
        "miami",
        "valencia",
    }


def test_report_endpoint_defaults_to_last_seven_days(
    client: TestClient, monkeypatch
) -> None:
    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc)

    monkeypatch.setattr(telemetry_router, "datetime", FixedDateTime)
    telemetry_router.clear_report_cache()
    response = client.get("/telemetry/report")
    assert response.status_code == 200
    assert response.json()["period"] == {"from": "2026-07-06", "to": "2026-07-13"}


def test_report_endpoint_rejects_inverted_range(client: TestClient) -> None:
    response = client.get(
        "/telemetry/report",
        params={"start_date": "2026-07-12", "end_date": "2026-07-10"},
    )
    assert response.status_code == 422


def test_report_cache_avoids_recalculation(client: TestClient, monkeypatch) -> None:
    _seed_report_fixture()
    telemetry_router.clear_report_cache()
    calls = {"count": 0}
    original = telemetry_router._build_report

    def wrapped(session, start_dt, end_dt):
        calls["count"] += 1
        return original(session, start_dt, end_dt)

    monkeypatch.setattr(telemetry_router, "_build_report", wrapped)

    params = {"start_date": "2026-07-10", "end_date": "2026-07-12"}
    first = client.get("/telemetry/report", params=params)
    second = client.get("/telemetry/report", params=params)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()
    assert calls["count"] == 1


def test_report_cache_expires_after_ttl(client: TestClient, monkeypatch) -> None:
    _seed_report_fixture()
    telemetry_router.clear_report_cache()
    calls = {"count": 0}
    original = telemetry_router._build_report
    clock = {"now": 1000.0}

    def wrapped(session, start_dt, end_dt):
        calls["count"] += 1
        return original(session, start_dt, end_dt)

    monkeypatch.setattr(telemetry_router, "_build_report", wrapped)
    monkeypatch.setattr(telemetry_router.time, "monotonic", lambda: clock["now"])

    params = {"start_date": "2026-07-10", "end_date": "2026-07-12"}
    assert client.get("/telemetry/report", params=params).status_code == 200
    clock["now"] = 1061.0  # beyond 60s TTL
    assert client.get("/telemetry/report", params=params).status_code == 200
    assert calls["count"] == 2
