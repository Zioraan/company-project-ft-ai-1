"""In-memory store for the most recent incident analysis."""

from __future__ import annotations

from domain.incident_analysis import AnalysisResult

_last_result: AnalysisResult | None = None


def save_analysis(result: AnalysisResult) -> None:
    global _last_result
    _last_result = result


def get_last_analysis() -> AnalysisResult | None:
    return _last_result


def clear_analysis() -> None:
    global _last_result
    _last_result = None
