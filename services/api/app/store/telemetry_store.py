"""Immutable telemetry persistence (bulk insert only)."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Session

from app.models.telemetry import TelemetryEventRecord
from app.schemas.telemetry import TelemetryEvent

DEFAULT_INGEST_SERVICE = "backoffice"


def _parse_timestamp(raw: str) -> datetime:
    normalized = raw.strip()
    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def to_record(
    event: TelemetryEvent,
    *,
    service: str = DEFAULT_INGEST_SERVICE,
) -> TelemetryEventRecord:
    return TelemetryEventRecord(
        event_id=event.eventId,
        timestamp=_parse_timestamp(event.timestamp),
        event_type=event.event_type,
        service=service,
        session_id=event.sessionId,
        user_id=event.userId,
        request_id=event.requestId,
        schema_version=event.schemaVersion,
        tags=dict(event.properties),
    )


def bulk_insert_events(
    session: Session,
    events: list[TelemetryEvent],
    *,
    service: str = DEFAULT_INGEST_SERVICE,
) -> int:
    """Insert all valid events in a single flush/commit. Returns stored count."""
    if not events:
        return 0

    records = [to_record(event, service=service) for event in events]
    session.add_all(records)
    session.commit()
    return len(records)
