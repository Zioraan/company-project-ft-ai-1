"""Metric and interval unit tests for sales forecast."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.sales_forecast import (  # noqa: E402
    apply_prediction_interval,
    interpret_psi,
    normalized_gini,
    population_stability_index,
    regression_gini,
)


def test_gini_perfect_ranking() -> None:
    y = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    assert normalized_gini(y, y) == pytest.approx(1.0)
    assert regression_gini(y, y) > 0


def test_gini_reversed_ranking_is_negative() -> None:
    y = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    pred = y[::-1].copy()
    assert normalized_gini(y, pred) < 0


def test_psi_identical_distributions_near_zero() -> None:
    rng = np.random.default_rng(42)
    sample = rng.normal(1000, 50, size=200)
    psi = population_stability_index(sample, sample.copy())
    assert psi < 0.01
    assert interpret_psi(psi) == "stable"


def test_interval_lower_bound_positive() -> None:
    preds = np.array([10.0, 5.0, 100.0])
    lower, upper = apply_prediction_interval(preds, width=20.0, lower_floor=1.0)
    assert (lower >= 1.0).all()
    assert (upper > lower).all()
