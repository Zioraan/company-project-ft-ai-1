"""Tests for the incidents FastAPI routes."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.store.analysis_store import clear_analysis

ROOT_DIR = Path(__file__).resolve().parents[1]
FIXTURE_PATH = ROOT_DIR / "tests" / "fixtures" / "incidents-synthetic.csv"


@pytest.fixture(autouse=True)
def reset_store() -> None:
    clear_analysis()


def test_unauthenticated_analyze_returns_401(client: TestClient) -> None:
    with FIXTURE_PATH.open("rb") as handle:
        response = client.post(
            "/api/incidents/analyze",
            files={"file": ("incidents-synthetic.csv", handle, "text/csv")},
        )

    assert response.status_code == 401


def test_unauthenticated_export_returns_401(client: TestClient) -> None:
    response = client.get("/api/incidents/results/export")
    assert response.status_code == 401


def test_analyze_endpoint_returns_summary(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    with FIXTURE_PATH.open("rb") as handle:
        response = client.post(
            "/api/incidents/analyze",
            files={"file": ("incidents-synthetic.csv", handle, "text/csv")},
            headers=auth_headers,
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["totals"]["total_records"] == 10
    assert payload["totals"]["valid_count"] == 3
    assert payload["totals"]["invalid_count"] == 7
    assert payload["satisfaction"]["average"] == 4.5
    assert "@" not in response.text


def test_export_endpoint_returns_csv(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    with FIXTURE_PATH.open("rb") as handle:
        client.post(
            "/api/incidents/analyze",
            files={"file": ("incidents-synthetic.csv", handle, "text/csv")},
            headers=auth_headers,
        )

    response = client.get("/api/incidents/results/export", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "metric,value" in response.text
    assert "@" not in response.text


def test_export_without_analysis_returns_404(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.get("/api/incidents/results/export", headers=auth_headers)
    assert response.status_code == 404


def test_analyze_rejects_empty_file(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("empty.csv", b"", "text/csv")},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_analyze_rejects_non_csv_extension(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("notes.txt", b"hello", "text/plain")},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_analyze_rejects_missing_header(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("bad.csv", b"ticket_id,date\n", "text/csv")},
        headers=auth_headers,
    )
    assert response.status_code == 400
