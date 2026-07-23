"""Required 8/2 chronological split and leakage guards for sales forecast."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.sales_forecast import (  # noqa: E402
    SPLIT_CUTOFF,
    fit_final_model,
    load_sales_csv,
    recursive_forecast,
    split_train_test,
    training_matrix,
    validate_sales_dataset,
)

CSV_PATH = ROOT / "data" / "raw" / "nexova_sales.csv"


@pytest.fixture(scope="module")
def validated() -> pd.DataFrame:
    return validate_sales_dataset(load_sales_csv(CSV_PATH))


@pytest.fixture(scope="module")
def split(validated: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    return split_train_test(validated)


def test_split_row_counts(split: tuple[pd.DataFrame, pd.DataFrame]) -> None:
    train, test = split
    assert len(train) == 96
    assert len(test) == 24


def test_split_date_boundaries(split: tuple[pd.DataFrame, pd.DataFrame]) -> None:
    train, test = split
    assert train["month"].min() == pd.Timestamp("2016-01-01")
    assert train["month"].max() == pd.Timestamp("2023-12-01")
    assert test["month"].min() == pd.Timestamp("2024-01-01")
    assert test["month"].max() == pd.Timestamp("2025-12-01")
    assert train["month"].max() < test["month"].min()
    assert train["month"].max() < SPLIT_CUTOFF
    assert test["month"].min() >= SPLIT_CUTOFF


def test_split_disjoint_and_chronological(
    split: tuple[pd.DataFrame, pd.DataFrame],
) -> None:
    train, test = split
    assert set(train["month"]).isdisjoint(set(test["month"]))
    assert train["month"].is_monotonic_increasing
    assert test["month"].is_monotonic_increasing


def test_training_does_not_use_test_targets(
    split: tuple[pd.DataFrame, pd.DataFrame],
) -> None:
    train, test = split
    x, y, _ = training_matrix(train)
    assert len(x) == len(y)
    # All training targets come from pre-cutoff months only.
    assert train["month"].max() < test["month"].min()
    assert y.min() > 0


def test_recursive_forecast_history_uses_predictions_not_actuals(
    split: tuple[pd.DataFrame, pd.DataFrame],
) -> None:
    train, test = split
    x, y, _ = training_matrix(train)
    model = fit_final_model(x, y)
    forecast_df, preds = recursive_forecast(model, train, test["month"])
    assert len(preds) == 24
    assert len(forecast_df) == 24
    # Predictions must differ from at least some actuals (not copying test y).
    actuals = test["revenue_usd"].to_numpy(dtype=float)
    assert not (actuals == preds).all()
