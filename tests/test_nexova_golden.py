"""Golden-file verification for docs/incidents-nexova.csv."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.incident_analysis import (  # noqa: E402
    analyze_incidents,
    format_console_report,
    load_incidents,
    results_csv_text,
)

NEXOVA_FIXTURE = ROOT_DIR / "scripts" / "incidents-nexova.csv"

EXPECTED_CATEGORY_COUNTS = {
    "TECHNICAL": 28,
    "BILLING": 18,
    "ACCESS": 21,
    "HR_QUERY": 17,
    "COMPLAINT": 12,
}
EXPECTED_STATUS_COUNTS = {
    "OPEN": 27,
    "CLOSED": 56,
    "DISCARDED": 13,
}
EXPECTED_INVALID_BREAKDOWN = {
    "missing_client_company": 1,
    "invalid_category": 1,
    "invalid_email": 1,
    "closed_no_score": 1,
}
EXPECTED_SATISFACTION_DISTRIBUTION = {1: 2, 2: 5, 3: 10, 4: 22, 5: 17}

EXPECTED_CONSOLE_LINES = [
    "TOTAL RECORDS IN FILE .......... 100",
    "  ├─ Valid records ................ 96",
    "  └─ Invalid / incomplete .......... 4",
    "  ├─ Missing client_company ........ 1",
    "  ├─ Invalid or missing category ... 1",
    "  ├─ Invalid or missing email ...... 1",
    "  └─ Closed ticket, no score ....... 1",
    "  ├─ TECHNICAL ..................... 28  (29.2%)",
    "  ├─ BILLING ....................... 18  (18.8%)",
    "  ├─ ACCESS ........................ 21  (21.9%)",
    "  ├─ HR_QUERY ...................... 17  (17.7%)",
    "  └─ COMPLAINT ..................... 12  (12.5%)",
    "  ├─ OPEN .......................... 27  (28.1%)",
    "  ├─ CLOSED ........................ 56  (58.3%)",
    "  └─ DISCARDED ..................... 13  (13.5%)",
    "  Scored tickets: 56 of 56",
    "  Average score: 3.84 / 5.00",
    "  ├─ Score 1 (Very dissatisfied) ... 2",
    "  ├─ Score 2 (Dissatisfied) ........ 5",
    "  ├─ Score 3 (Neutral) ............. 10",
    "  ├─ Score 4 (Satisfied) ........... 22",
    "  └─ Score 5 (Very satisfied) ...... 17",
]


def test_nexova_fixture_matches_context_metrics() -> None:
    assert NEXOVA_FIXTURE.exists(), "docs/incidents-nexova.csv is required for eval E-I12"

    _, rows = load_incidents(NEXOVA_FIXTURE)
    result = analyze_incidents(rows, source_name="incidents-nexova.csv")

    assert result.total_records == 100
    assert result.valid_count == 96
    assert result.invalid_count == 4
    assert result.invalid_breakdown == EXPECTED_INVALID_BREAKDOWN
    assert result.satisfaction.average == 3.84
    assert result.satisfaction.scored_tickets == 56
    assert result.satisfaction.closed_tickets == 56
    assert result.satisfaction.distribution == EXPECTED_SATISFACTION_DISTRIBUTION

    category_counts = {item.category: item.count for item in result.by_category}
    status_counts = {item.status: item.count for item in result.by_status}

    assert category_counts == EXPECTED_CATEGORY_COUNTS
    assert status_counts == EXPECTED_STATUS_COUNTS
    assert [item.category for item in result.by_category] == list(EXPECTED_CATEGORY_COUNTS)


def test_nexova_console_output_matches_context_formatting() -> None:
    _, rows = load_incidents(NEXOVA_FIXTURE)
    result = analyze_incidents(rows, source_name="incidents-nexova.csv")
    report = format_console_report(result)

    for expected_line in EXPECTED_CONSOLE_LINES:
        assert expected_line in report


def test_nexova_export_contains_no_emails() -> None:
    _, rows = load_incidents(NEXOVA_FIXTURE)
    result = analyze_incidents(rows, source_name="incidents-nexova.csv")
    csv_text = results_csv_text(result)

    assert "@" not in csv_text
    assert "metric,value" in csv_text
    assert "total_records,100" in csv_text
    assert "satisfaction_average,3.84" in csv_text
