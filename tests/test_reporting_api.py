"""API tests for reporting weekly office/programme performance."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.database import get_engine
from app.models.reporting import WeeklyOfficeProgramPerformance
from app.models.telemetry import TelemetryEventRecord
from app.store import telemetry_store
from app.schemas.telemetry import TelemetryEvent


def _seed_material_events(session: Session) -> None:
    events = [
        TelemetryEvent(
            eventId="11111111-1111-4111-8111-111111111101",
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
                "unit_cost": 50.0,
            },
        ),
        TelemetryEvent(
            eventId="11111111-1111-4111-8111-111111111102",
            timestamp="2026-07-14T11:00:00.000Z",
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
        TelemetryEvent(
            eventId="11111111-1111-4111-8111-111111111103",
            timestamp="2026-07-15T09:00:00.000Z",
            sessionId="sess",
            userId="user",
            event_type="stock_threshold_triggered",
            schemaVersion="1.0.0",
            requestId="req-3",
            properties={
                "office": "valencia",
                "programme_id": "b2b-sales",
                "product_id": 1,
                "product_category": "training_kit",
                "quantity": 1,
                "currency": "EUR",
            },
        ),
        TelemetryEvent(
            eventId="11111111-1111-4111-8111-111111111104",
            timestamp="2026-07-15T12:00:00.000Z",
            sessionId="sess",
            userId="user",
            event_type="kit_cost_variance_detected",
            schemaVersion="1.0.0",
            requestId="req-4",
            properties={
                "office": "valencia",
                "programme_id": "b2b-sales",
                "product_id": 1,
                "product_category": "training_kit",
                "quantity": 1,
                "currency": "EUR",
                "unit_cost": 60.0,
            },
        ),
        TelemetryEvent(
            eventId="11111111-1111-4111-8111-111111111105",
            timestamp="2026-07-14T16:00:00.000Z",
            sessionId="sess",
            userId="user",
            event_type="outbound_order_created",
            schemaVersion="1.0.0",
            requestId="req-5",
            properties={
                "office": "miami",
                "programme_id": "b2b-sales",
                "product_id": 2,
                "product_category": "training_kit",
                "quantity": 1,
                "currency": "USD",
            },
        ),
    ]
    telemetry_store.bulk_insert_events(session, events)


def test_reporting_requires_auth(client: TestClient) -> None:
    assert (
        client.get("/reporting/weekly-office-program-performance").status_code
        == 401
    )
    assert (
        client.post(
            "/reporting/weekly-office-program-performance/compute",
            json={"week_start": "2026-07-13"},
        ).status_code
        == 401
    )


def test_compute_and_get_weekly_performance(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    with Session(get_engine()) as session:
        _seed_material_events(session)

    compute = client.post(
        "/reporting/weekly-office-program-performance/compute",
        json={"week_start": "2026-07-13"},
        headers=auth_headers,
    )
    assert compute.status_code == 200
    assert compute.json()["week_start"] == "2026-07-13"
    assert compute.json()["records_loaded"] == 2

    # Idempotent recompute
    again = client.post(
        "/reporting/weekly-office-program-performance/compute",
        json={"week_start": "2026-07-13"},
        headers=auth_headers,
    )
    assert again.status_code == 200
    assert again.json()["records_loaded"] == 2

    with Session(get_engine()) as session:
        count = len(session.exec(select(WeeklyOfficeProgramPerformance)).all())
        assert count == 2

    response = client.get(
        "/reporting/weekly-office-program-performance",
        params={"week_start": "2026-07-13"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["week_start"] == "2026-07-13"
    by_office = {entry["office"]: entry for entry in body["entries"]}
    assert by_office["valencia"]["total_material_cost"] == 100.0
    assert by_office["valencia"]["kits_delivered_count"] == 1
    assert by_office["valencia"]["shortage_events_count"] == 1
    assert by_office["valencia"]["cost_variance_events_count"] == 1
    assert by_office["valencia"]["currency"] == "EUR"
    assert by_office["miami"]["kits_delivered_count"] == 1
    assert by_office["miami"]["currency"] == "USD"
    assert by_office["miami"]["total_material_cost"] == 0.0


def test_get_weekly_performance_404_when_empty(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.get(
        "/reporting/weekly-office-program-performance",
        headers=auth_headers,
    )
    assert response.status_code == 404
