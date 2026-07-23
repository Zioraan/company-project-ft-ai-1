"""Unit tests for weekly office/programme performance aggregation."""

from __future__ import annotations

from datetime import datetime, timezone

from app.models.telemetry import TelemetryEventRecord
from domain.weekly_office_program_performance import aggregate_weekly_performance


def _event(
    event_type: str,
    *,
    day: int,
    office: str,
    programme_id: str,
    currency: str,
    unit_cost: float | None = None,
    quantity: int = 1,
    total_cost: float | None = None,
) -> TelemetryEventRecord:
    tags: dict = {
        "office": office,
        "programme_id": programme_id,
        "currency": currency,
        "quantity": quantity,
        "product_id": 1,
        "product_category": "training_kit",
    }
    if unit_cost is not None:
        tags["unit_cost"] = unit_cost
    if total_cost is not None:
        tags["total_cost"] = total_cost
    return TelemetryEventRecord(
        event_id=f"{event_type}-{office}-{day}-{quantity}",
        timestamp=datetime(2026, 7, day, 12, 0, tzinfo=timezone.utc),
        event_type=event_type,
        service="backoffice",
        session_id="s",
        user_id="u",
        request_id="r",
        schema_version="1.0.0",
        tags=tags,
    )


def test_aggregate_sums_costs_and_counts_by_grain() -> None:
    events = [
        _event(
            "inbound_order_created",
            day=13,
            office="valencia",
            programme_id="b2b-sales",
            currency="EUR",
            unit_cost=10,
            quantity=2,
        ),
        _event(
            "inbound_order_created",
            day=14,
            office="valencia",
            programme_id="b2b-sales",
            currency="EUR",
            total_cost=5,
        ),
        _event(
            "outbound_order_created",
            day=15,
            office="valencia",
            programme_id="b2b-sales",
            currency="EUR",
        ),
        _event(
            "stock_threshold_triggered",
            day=15,
            office="valencia",
            programme_id="b2b-sales",
            currency="EUR",
        ),
        _event(
            "kit_cost_variance_detected",
            day=16,
            office="valencia",
            programme_id="b2b-sales",
            currency="EUR",
        ),
        _event(
            "outbound_order_created",
            day=14,
            office="miami",
            programme_id="b2b-sales",
            currency="USD",
        ),
    ]
    rows = aggregate_weekly_performance(events)
    assert len(rows) == 2
    vlc = next(r for r in rows if r.office == "valencia")
    mia = next(r for r in rows if r.office == "miami")
    assert vlc.week_start.isoformat() == "2026-07-13"
    assert vlc.total_material_cost == 25.0  # 10*2 + 5
    assert vlc.kits_delivered_count == 1
    assert vlc.shortage_events_count == 1
    assert vlc.cost_variance_events_count == 1
    assert vlc.currency == "EUR"
    assert mia.kits_delivered_count == 1
    assert mia.currency == "USD"
    assert mia.total_material_cost == 0.0


def test_aggregate_skips_missing_dimensions() -> None:
    events = [
        TelemetryEventRecord(
            event_id="bad",
            timestamp=datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc),
            event_type="outbound_order_created",
            service="backoffice",
            session_id="s",
            user_id="u",
            request_id="r",
            schema_version="1.0.0",
            tags={"office": "valencia"},  # missing programme_id
        )
    ]
    assert aggregate_weekly_performance(events) == []


def test_aggregate_empty() -> None:
    assert aggregate_weekly_performance([]) == []
