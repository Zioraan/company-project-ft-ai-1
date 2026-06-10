"""Tests for the incidents FastAPI routes."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from app.main import app  # noqa: E402
from app.store.analysis_store import clear_analysis  # noqa: E402

FIXTURE_PATH = ROOT_DIR / "tests" / "fixtures" / "incidents-synthetic.csv"
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store() -> None:
    clear_analysis()


def test_analyze_endpoint_returns_summary() -> None:
    with FIXTURE_PATH.open("rb") as handle:
        response = client.post(
            "/api/incidents/analyze",
            files={"file": ("incidents-synthetic.csv", handle, "text/csv")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["totals"]["total_records"] == 10
    assert payload["totals"]["valid_count"] == 3
    assert payload["totals"]["invalid_count"] == 7
    assert payload["satisfaction"]["average"] == 4.5
    assert "@" not in response.text


def test_export_endpoint_returns_csv() -> None:
    with FIXTURE_PATH.open("rb") as handle:
        client.post(
            "/api/incidents/analyze",
            files={"file": ("incidents-synthetic.csv", handle, "text/csv")},
        )

    response = client.get("/api/incidents/results/export")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "metric,value" in response.text
    assert "@" not in response.text


def test_export_without_analysis_returns_404() -> None:
    response = client.get("/api/incidents/results/export")
    assert response.status_code == 404


def test_analyze_rejects_empty_file() -> None:
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("empty.csv", b"", "text/csv")},
    )
    assert response.status_code == 400


def test_analyze_rejects_non_csv_extension() -> None:
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400


def test_analyze_rejects_missing_header() -> None:
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("bad.csv", b"ticket_id,date\n", "text/csv")},
    )
    assert response.status_code == 400
