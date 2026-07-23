"""Feature engineering and schema tests for sales forecast."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.sales_forecast import (  # noqa: E402
    FEATURE_COLUMNS,
    SalesDataValidationError,
    build_feature_frame,
    load_sales_csv,
    split_train_test,
    validate_sales_dataset,
)

CSV_PATH = ROOT / "data" / "raw" / "nexova_sales.csv"


@pytest.fixture(scope="module")
def train() -> pd.DataFrame:
    validated = validate_sales_dataset(load_sales_csv(CSV_PATH))
    train_df, _ = split_train_test(validated)
    return train_df


def test_validate_rejects_missing_column(train: pd.DataFrame) -> None:
    bad = train.drop(columns=["revenue_usd"])
    with pytest.raises(SalesDataValidationError, match="Missing required columns"):
        validate_sales_dataset(bad)


def test_validate_rejects_gap(train: pd.DataFrame) -> None:
    gappy = train.iloc[1:].copy()
    with pytest.raises(SalesDataValidationError):
        validate_sales_dataset(gappy)


def test_rolling_features_exclude_current_target(train: pd.DataFrame) -> None:
    featured = build_feature_frame(train)
    # For row i, rolling_mean_3 should equal mean of revenue[i-3:i] (shifted).
    for i in range(12, min(20, len(featured))):
        expected_3 = float(featured["revenue_usd"].iloc[i - 3 : i].mean())
        assert featured["revenue_rolling_mean_3"].iloc[i] == pytest.approx(expected_3)
        expected_12 = float(featured["revenue_usd"].iloc[i - 12 : i].mean())
        assert featured["revenue_rolling_mean_12"].iloc[i] == pytest.approx(
            expected_12
        )
        assert featured["revenue_lag_1"].iloc[i] == pytest.approx(
            featured["revenue_usd"].iloc[i - 1]
        )
        assert featured["revenue_lag_12"].iloc[i] == pytest.approx(
            featured["revenue_usd"].iloc[i - 12]
        )


def test_feature_columns_exclude_leakage_fields(train: pd.DataFrame) -> None:
    featured = build_feature_frame(train)
    for forbidden in (
        "business_line",
        "active_contracts",
        "avg_contract_value_usd",
    ):
        assert forbidden not in FEATURE_COLUMNS
    assert set(FEATURE_COLUMNS).issubset(set(featured.columns))
    eligible = featured.dropna(subset=list(FEATURE_COLUMNS))
    assert not eligible.empty
    assert np.isfinite(eligible[list(FEATURE_COLUMNS)].to_numpy()).all()
