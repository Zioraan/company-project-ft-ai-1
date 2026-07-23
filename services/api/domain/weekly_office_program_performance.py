"""Weekly office/programme performance KPI aggregation from telemetry_events."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, select

from app.models.telemetry import TelemetryEventRecord

INBOUND = "inbound_order_created"
OUTBOUND = "outbound_order_created"
SHORTAGE = "stock_threshold_triggered"
VARIANCE = "kit_cost_variance_detected"

BUSINESS_EVENT_TYPES = frozenset({INBOUND, OUTBOUND, SHORTAGE, VARIANCE})


@dataclass(frozen=True)
class WeeklyPerformanceRow:
    office: str
    programme_id: str
    week_start: date
    total_material_cost: float
    kits_delivered_count: int
    shortage_events_count: int
    cost_variance_events_count: int
    currency: str

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["week_start"] = self.week_start.isoformat()
        return payload


def currency_for_office(office: str) -> str:
    return "USD" if office.strip().lower() == "miami" else "EUR"


def iso_week_start_utc(moment: datetime) -> date:
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    else:
        moment = moment.astimezone(timezone.utc)
    return (moment.date() - timedelta(days=moment.weekday()))


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _inbound_cost(tags: dict[str, Any]) -> float:
    if "total_cost" in tags and tags["total_cost"] is not None:
        try:
            return float(tags["total_cost"])
        except (TypeError, ValueError):
            pass
    try:
        unit = float(tags.get("unit_cost") or 0)
        qty = float(tags.get("quantity") or 0)
        return unit * qty
    except (TypeError, ValueError):
        return 0.0


def load_business_events(
    session: Session,
    *,
    window_start: datetime,
    window_end: datetime,
) -> list[TelemetryEventRecord]:
    """Load mandatory business-metric events in [window_start, window_end)."""
    start = _as_utc(window_start)
    end = _as_utc(window_end)
    rows = session.exec(
        select(TelemetryEventRecord).where(
            TelemetryEventRecord.event_type.in_(BUSINESS_EVENT_TYPES),  # type: ignore[attr-defined]
            TelemetryEventRecord.timestamp >= start,
            TelemetryEventRecord.timestamp < end,
        )
    ).all()
    return list(rows)


def aggregate_weekly_performance(
    events: list[TelemetryEventRecord],
) -> list[WeeklyPerformanceRow]:
    """Aggregate events into one row per office / programme_id / week_start."""
    totals: dict[tuple[str, str, date, str], dict[str, float | int]] = defaultdict(
        lambda: {
            "total_material_cost": 0.0,
            "kits_delivered_count": 0,
            "shortage_events_count": 0,
            "cost_variance_events_count": 0,
        }
    )

    for event in events:
        tags = event.tags or {}
        office = str(tags.get("office") or "").strip().lower()
        programme_id = str(tags.get("programme_id") or "").strip()
        if not office or not programme_id:
            continue

        week_start = iso_week_start_utc(_as_utc(event.timestamp))
        currency = str(tags.get("currency") or currency_for_office(office)).upper()
        if currency not in {"EUR", "USD"}:
            currency = currency_for_office(office)

        key = (office, programme_id, week_start, currency)
        bucket = totals[key]

        if event.event_type == INBOUND:
            bucket["total_material_cost"] = float(bucket["total_material_cost"]) + _inbound_cost(
                tags
            )
        elif event.event_type == OUTBOUND:
            bucket["kits_delivered_count"] = int(bucket["kits_delivered_count"]) + 1
        elif event.event_type == SHORTAGE:
            bucket["shortage_events_count"] = int(bucket["shortage_events_count"]) + 1
        elif event.event_type == VARIANCE:
            bucket["cost_variance_events_count"] = (
                int(bucket["cost_variance_events_count"]) + 1
            )

    rows = [
        WeeklyPerformanceRow(
            office=office,
            programme_id=programme_id,
            week_start=week_start,
            total_material_cost=round(float(metrics["total_material_cost"]), 4),
            kits_delivered_count=int(metrics["kits_delivered_count"]),
            shortage_events_count=int(metrics["shortage_events_count"]),
            cost_variance_events_count=int(metrics["cost_variance_events_count"]),
            currency=currency,
        )
        for (office, programme_id, week_start, currency), metrics in totals.items()
    ]
    rows.sort(key=lambda row: (row.week_start, row.office, row.programme_id, row.currency))
    return rows


def compute_weekly_performance_for_window(
    session: Session,
    *,
    window_start: datetime,
    window_end: datetime,
) -> list[WeeklyPerformanceRow]:
    events = load_business_events(
        session,
        window_start=window_start,
        window_end=window_end,
    )
    return aggregate_weekly_performance(events)


def week_window_utc(week_start: date) -> tuple[datetime, datetime]:
    start = datetime(
        week_start.year,
        week_start.month,
        week_start.day,
        tzinfo=timezone.utc,
    )
    end = start + timedelta(days=7)
    return start, end
