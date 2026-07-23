"""Tests for Phase 2B telemetry storage ingest endpoint."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.database import get_engine
from app.models.telemetry import TelemetryEventRecord


def _sample_event(**overrides: object) -> dict[str, object]:
    event: dict[str, object] = {
        "eventId": "11111111-1111-4111-8111-111111111111",
        "timestamp": "2026-07-13T10:00:00.000Z",
        "sessionId": "22222222-2222-4222-8222-222222222222",
        "userId": "33333333-3333-4333-8333-333333333333",
        "event_type": "asset_list_viewed",
        "schemaVersion": "1.0.0",
        "requestId": "44444444-4444-4444-8444-444444444444",
        "properties": {"view_source": "nav_menu", "result_count": 3},
    }
    event.update(overrides)
    return event


def test_telemetry_events_accepts_batch_without_auth(client: TestClient) -> None:
    response = client.post(
        "/telemetry/events",
        json={
            "events": [
                _sample_event(),
                _sample_event(
                    eventId="55555555-5555-4555-8555-555555555555",
                    event_type="user_login_succeeded",
                    properties={},
                ),
            ]
        },
    )
    assert response.status_code == 200
    assert response.json() == {"received": 2, "stored": 2, "rejected": 0}


def test_telemetry_events_accepts_empty_batch(client: TestClient) -> None:
    response = client.post("/telemetry/events", json={"events": []})
    assert response.status_code == 200
    assert response.json() == {"received": 0, "stored": 0, "rejected": 0}


def test_telemetry_events_rejects_malformed_outer_body(client: TestClient) -> None:
    response = client.post("/telemetry/events", json={"events": "not-a-list"})
    assert response.status_code == 422


def test_telemetry_events_rejects_missing_events_key(client: TestClient) -> None:
    response = client.post("/telemetry/events", json={"items": []})
    assert response.status_code == 422


def test_telemetry_mixed_batch_stores_valid_and_counts_rejected(
    client: TestClient,
) -> None:
    bad_missing = _sample_event(eventId="bad-missing-session")
    del bad_missing["sessionId"]
    response = client.post(
        "/telemetry/events",
        json={
            "events": [
                _sample_event(
                    eventId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                    event_type="inbound_order_created",
                    properties={
                        "inbound_order_id": 1,
                        "product_id": 2,
                        "product_category": "training_kit",
                        "programme_id": "b2b-sales",
                        "office": "valencia",
                        "quantity": 5,
                        "currency": "EUR",
                        "unit_cost": 45.0,
                        "vendor": "Acme",
                        "created_by": "33333333-3333-4333-8333-333333333333",
                    },
                ),
                bad_missing,
                _sample_event(
                    eventId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                    event_type="outbound_order_created",
                    properties={
                        "outbound_order_id": 9,
                        "product_id": 2,
                        "product_category": "certification",
                        "programme_id": "basic-leadership",
                        "office": "miami",
                        "quantity": 1,
                        "currency": "USD",
                        "created_by": "33333333-3333-4333-8333-333333333333",
                    },
                ),
                _sample_event(eventId="", userId=""),
                None,
            ]
        },
    )
    assert response.status_code == 200
    assert response.json() == {"received": 5, "stored": 2, "rejected": 3}

    with Session(get_engine()) as session:
        rows = session.exec(select(TelemetryEventRecord)).all()
        assert len(rows) == 2
        by_type = {row.event_type: row for row in rows}
        assert by_type["inbound_order_created"].service == "backoffice"
        assert by_type["inbound_order_created"].tags["office"] == "valencia"
        assert by_type["inbound_order_created"].tags["unit_cost"] == 45.0
        assert by_type["inbound_order_created"].tags["programme_id"] == "b2b-sales"
        assert by_type["outbound_order_created"].tags["office"] == "miami"
        assert by_type["outbound_order_created"].timestamp is not None
        assert "name" not in by_type["outbound_order_created"].tags


def test_telemetry_invalid_event_alone_returns_rejected_not_http_error(
    client: TestClient,
) -> None:
    bad_event = _sample_event()
    del bad_event["sessionId"]
    response = client.post("/telemetry/events", json={"events": [bad_event]})
    assert response.status_code == 200
    assert response.json() == {"received": 1, "stored": 0, "rejected": 1}


def test_telemetry_empty_string_envelope_fields_are_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/telemetry/events",
        json={"events": [_sample_event(eventId="", userId="")]},
    )
    assert response.status_code == 200
    assert response.json() == {"received": 1, "stored": 0, "rejected": 1}


def test_telemetry_non_object_properties_are_rejected(client: TestClient) -> None:
    response = client.post(
        "/telemetry/events",
        json={"events": [_sample_event(properties="not-an-object")]},
    )
    assert response.status_code == 200
    assert response.json() == {"received": 1, "stored": 0, "rejected": 1}


def test_telemetry_wrong_types_for_envelope_fields_are_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/telemetry/events",
        json={"events": [_sample_event(event_type=123, schemaVersion=True)]},
    )
    assert response.status_code == 200
    assert response.json() == {"received": 1, "stored": 0, "rejected": 1}


def test_telemetry_accepts_extra_unknown_event_fields(client: TestClient) -> None:
    response = client.post(
        "/telemetry/events",
        json={
            "events": [
                _sample_event(
                    extra_noise="ignored",
                    properties={"view_source": "nav_menu"},
                )
            ]
        },
    )
    assert response.status_code == 200
    assert response.json() == {"received": 1, "stored": 1, "rejected": 0}


def test_telemetry_bulk_insert_is_single_flush(client: TestClient, monkeypatch) -> None:
    from app.store import telemetry_store

    calls: list[int] = []
    original = telemetry_store.bulk_insert_events

    def wrapped(session, events, *, service="backoffice"):
        calls.append(len(events))
        return original(session, events, service=service)

    monkeypatch.setattr(telemetry_store, "bulk_insert_events", wrapped)

    response = client.post(
        "/telemetry/events",
        json={
            "events": [
                _sample_event(eventId="cccccccc-cccc-4ccc-8ccc-cccccccccccc"),
                _sample_event(eventId="dddddddd-dddd-4ddd-8ddd-dddddddddddd"),
                _sample_event(eventId="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["stored"] == 3
    assert calls == [3]


def test_telemetry_endpoint_in_settings() -> None:
    from app.core.config import get_settings

    settings = get_settings()
    assert settings.telemetry_endpoint.endswith("/telemetry/events")
