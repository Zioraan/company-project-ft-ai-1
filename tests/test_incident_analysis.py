"""Tests for incident CSV validation and metrics."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.incident_analysis import (  # noqa: E402
    EmptyFileError,
    MissingHeaderError,
    NoDataRowsError,
    analysis_to_metric_rows,
    analyze_incidents,
    load_incidents,
    load_incidents_from_text,
    results_csv_text,
    validate_record,
)

FIXTURE_PATH = ROOT_DIR / "tests" / "fixtures" / "incidents-synthetic.csv"


def test_validate_record_detects_all_rules() -> None:
    cases = [
        ({"client_company": ""}, ["missing_client_company"]),
        ({"category": "UNKNOWN"}, ["invalid_category"]),
        ({"description": "abc"}, ["empty_description"]),
        ({"agent_id": "BAD"}, ["invalid_agent_id"]),
        ({"customer_email": "invalid"}, ["invalid_email"]),
        (
            {"status": "CLOSED", "satisfaction_score": ""},
            ["closed_no_score"],
        ),
        (
            {"status": "OPEN", "satisfaction_score": "9"},
            ["score_out_of_range"],
        ),
    ]

    base_row = {
        "ticket_id": "NXV-000001",
        "date": "2024-01-01",
        "client_company": "Acme Corp",
        "category": "TECHNICAL",
        "description": "Valid description text",
        "agent_id": "AGT-01",
        "status": "OPEN",
        "customer_email": "user@example.com",
        "satisfaction_score": "",
    }

    for overrides, expected_rules in cases:
        row = {**base_row, **overrides}
        assert validate_record(row) == expected_rules


def test_analyze_synthetic_fixture_counts() -> None:
    _, rows = load_incidents(FIXTURE_PATH)
    result = analyze_incidents(rows, source_name="incidents-synthetic.csv")

    assert result.total_records == 10
    assert result.valid_count == 3
    assert result.invalid_count == 7
    assert result.invalid_breakdown["missing_client_company"] == 1
    assert result.invalid_breakdown["invalid_category"] == 1
    assert result.invalid_breakdown["empty_description"] == 1
    assert result.invalid_breakdown["invalid_agent_id"] == 1
    assert result.invalid_breakdown["invalid_email"] == 1
    assert result.invalid_breakdown["closed_no_score"] == 1
    assert result.invalid_breakdown["score_out_of_range"] == 1

    category_counts = {item.category: item.count for item in result.by_category}
    assert category_counts == {"TECHNICAL": 2, "BILLING": 1}

    status_counts = {item.status: item.count for item in result.by_status}
    assert status_counts == {"OPEN": 1, "CLOSED": 2}

    assert result.satisfaction.scored_tickets == 2
    assert result.satisfaction.average == 4.5


def test_invalid_records_excluded_from_category_metrics() -> None:
    rows = [
        {
            "ticket_id": "NXV-000001",
            "date": "2024-01-01",
            "client_company": "",
            "category": "TECHNICAL",
            "description": "Valid description text",
            "agent_id": "AGT-01",
            "status": "OPEN",
            "customer_email": "user@example.com",
            "satisfaction_score": "",
        },
        {
            "ticket_id": "NXV-000002",
            "date": "2024-01-02",
            "client_company": "Acme Corp",
            "category": "TECHNICAL",
            "description": "Another valid description",
            "agent_id": "AGT-02",
            "status": "OPEN",
            "customer_email": "other@example.com",
            "satisfaction_score": "",
        },
    ]

    result = analyze_incidents(rows)
    assert result.valid_count == 1
    assert result.by_category[0].count == 1


def test_results_csv_has_one_metric_per_row_and_no_emails() -> None:
    _, rows = load_incidents(FIXTURE_PATH)
    result = analyze_incidents(rows, source_name="incidents-synthetic.csv")
    csv_text = results_csv_text(result)

    assert "metric,value" in csv_text
    assert "@" not in csv_text
    assert len(analysis_to_metric_rows(result)) >= 5


def test_load_errors() -> None:
    with pytest.raises(EmptyFileError):
        load_incidents_from_text("")

    with pytest.raises(MissingHeaderError):
        load_incidents_from_text("ticket_id,date\n")

    with pytest.raises(NoDataRowsError):
        load_incidents_from_text(
            "ticket_id,date,client_company,category,description,agent_id,status,customer_email,satisfaction_score\n"
        )
