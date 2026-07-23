"""Nexova monthly sales forecasting (Random Forest, leakage-safe).

Script/test-only domain module. Do not import from FastAPI routers — the
Compose backend image does not install scikit-learn/matplotlib.

Metric notes (why low MSE alone is insufficient):
- MSE/RMSE measure magnitude error in USD, not ranking quality.
- Normalized Gini measures discrimination (ranking) of high vs low months.
- PSI checks whether prediction distributions shifted train→test.
- K² (D’Agostino) assesses residual normality, not accuracy.
- Conformal intervals quantify uncertainty; coverage must be reported separately.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REQUIRED_COLUMNS = (
    "month",
    "revenue_usd",
    "active_contracts",
    "avg_contract_value_usd",
    "business_line",
)

EXPECTED_START = pd.Timestamp("2016-01-01")
EXPECTED_END = pd.Timestamp("2025-12-01")
SPLIT_CUTOFF = pd.Timestamp("2024-01-01")
EXPECTED_ROWS = 120
TRAIN_ROWS = 96
TEST_ROWS = 24
RANDOM_STATE = 42
PSI_EPSILON = 1e-6
INTERVAL_LOWER_FLOOR = 1.0
CONFORMAL_COVERAGE = 0.90

FEATURE_COLUMNS: tuple[str, ...] = (
    "time_index",
    "month_sin",
    "month_cos",
    "revenue_lag_1",
    "revenue_lag_12",
    "revenue_rolling_mean_3",
    "revenue_rolling_mean_12",
)

RF_PARAMS: dict[str, Any] = {
    "n_estimators": 300,
    "max_depth": 5,
    "min_samples_leaf": 3,
    "max_features": 0.8,
    "bootstrap": True,
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

MODEL_JUSTIFICATION = (
    "Random Forest was selected for 96 monthly training rows, nonlinear but "
    "structurally simple seasonality/growth patterns, Finance-facing "
    "explainability without boosting internals, no feature scaling, and "
    "compatibility with a separately calibrated prediction interval."
)


class SalesForecastError(Exception):
    """Base error for sales forecast failures."""


class SalesDataValidationError(SalesForecastError):
    """Raised when the sales CSV fails schema or integrity checks."""


# ---------------------------------------------------------------------------
# Load / validate / split
# ---------------------------------------------------------------------------


def load_sales_csv(path: str | Path) -> pd.DataFrame:
    """Load the raw sales CSV without mutating the source file."""
    csv_path = Path(path)
    if not csv_path.exists():
        raise SalesDataValidationError(f"Sales CSV not found: {csv_path}")
    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:  # noqa: BLE001 — surface actionable parse errors
        raise SalesDataValidationError(f"Unable to parse sales CSV: {exc}") from exc
    return df


def validate_sales_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Validate schema and integrity; return a sorted copy.

    Duplicate detection runs before sorting. Failures raise
    ``SalesDataValidationError`` with actionable messages.
    """
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise SalesDataValidationError(
            f"Missing required columns: {', '.join(missing)}"
        )

    work = df.copy()
    work["month"] = pd.to_datetime(work["month"], errors="coerce")
    if work["month"].isna().any():
        raise SalesDataValidationError(
            "One or more month values could not be parsed as YYYY-MM-01 dates."
        )

    if work["month"].duplicated().any():
        dupes = work.loc[work["month"].duplicated(), "month"].astype(str).tolist()
        raise SalesDataValidationError(f"Duplicate months found: {dupes}")

    work = work.sort_values("month").reset_index(drop=True)

    if len(work) != EXPECTED_ROWS:
        raise SalesDataValidationError(
            f"Expected {EXPECTED_ROWS} rows, found {len(work)}."
        )

    expected_months = pd.date_range(EXPECTED_START, EXPECTED_END, freq="MS")
    actual_months = pd.DatetimeIndex(work["month"])
    if actual_months.min() < EXPECTED_START or actual_months.max() > EXPECTED_END:
        raise SalesDataValidationError(
            f"Dates must fall within {EXPECTED_START.date()}–{EXPECTED_END.date()}."
        )
    missing_months = expected_months.difference(actual_months)
    if len(missing_months) > 0:
        raise SalesDataValidationError(
            "Missing months in range: "
            + ", ".join(m.strftime("%Y-%m-%d") for m in missing_months[:5])
            + ("..." if len(missing_months) > 5 else "")
        )

    for col in ("revenue_usd", "avg_contract_value_usd"):
        if work[col].isna().any() or (work[col].astype(str).str.strip() == "").any():
            raise SalesDataValidationError(f"Null or empty values in {col}.")
        if (pd.to_numeric(work[col], errors="coerce") <= 0).any():
            raise SalesDataValidationError(f"{col} must be positive for all rows.")

    if work["active_contracts"].isna().any():
        raise SalesDataValidationError("Null values in active_contracts.")
    if (pd.to_numeric(work["active_contracts"], errors="coerce") < 0).any():
        raise SalesDataValidationError("active_contracts must be non-negative.")

    if (work["business_line"].astype(str).str.strip() != "consolidated").any():
        raise SalesDataValidationError(
            "All rows must have business_line == 'consolidated'."
        )

    work["revenue_usd"] = pd.to_numeric(work["revenue_usd"], errors="raise")
    work["active_contracts"] = pd.to_numeric(
        work["active_contracts"], errors="raise"
    ).astype(int)
    work["avg_contract_value_usd"] = pd.to_numeric(
        work["avg_contract_value_usd"], errors="raise"
    )
    work["business_line"] = work["business_line"].astype(str).str.strip()
    return work


def split_train_test(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Chronological 8-year / 2-year split on validated raw rows."""
    train = df.loc[df["month"] < SPLIT_CUTOFF].copy().reset_index(drop=True)
    test = df.loc[df["month"] >= SPLIT_CUTOFF].copy().reset_index(drop=True)

    if len(train) != TRAIN_ROWS:
        raise SalesDataValidationError(
            f"Training split must have {TRAIN_ROWS} rows, found {len(train)}."
        )
    if len(test) != TEST_ROWS:
        raise SalesDataValidationError(
            f"Test split must have {TEST_ROWS} rows, found {len(test)}."
        )
    if train["month"].min() != EXPECTED_START or train["month"].max() != pd.Timestamp(
        "2023-12-01"
    ):
        raise SalesDataValidationError(
            "Training must begin 2016-01-01 and end 2023-12-01."
        )
    if test["month"].min() != SPLIT_CUTOFF or test["month"].max() != EXPECTED_END:
        raise SalesDataValidationError(
            "Test must begin 2024-01-01 and end 2025-12-01."
        )
    if train["month"].max() >= test["month"].min():
        raise SalesDataValidationError("Training and test months must not overlap.")
    if set(train["month"]).intersection(set(test["month"])):
        raise SalesDataValidationError("Training and test month sets must be disjoint.")
    return train, test


# ---------------------------------------------------------------------------
# Features
# ---------------------------------------------------------------------------
# Random Forest does not require feature scaling; no StandardScaler is used.


def _month_cycle(month_series: pd.Series) -> tuple[np.ndarray, np.ndarray]:
    month_num = month_series.dt.month.astype(float)
    angle = 2.0 * np.pi * (month_num - 1.0) / 12.0
    return np.sin(angle).to_numpy(), np.cos(angle).to_numpy()


def build_feature_frame(history: pd.DataFrame) -> pd.DataFrame:
    """Build leakage-safe features from a revenue history DataFrame.

    Rolling means are shifted by one month so the current target is excluded.
    Does not use contemporaneous contract fields or current revenue as features.
    """
    hist = history.sort_values("month").reset_index(drop=True).copy()
    origin = hist["month"].iloc[0]
    time_index = ((hist["month"].dt.year - origin.year) * 12) + (
        hist["month"].dt.month - origin.month
    )

    month_sin, month_cos = _month_cycle(hist["month"])
    revenue = hist["revenue_usd"].astype(float)

    features = pd.DataFrame(
        {
            "month": hist["month"],
            "revenue_usd": revenue,
            "time_index": time_index.astype(float),
            "month_sin": month_sin,
            "month_cos": month_cos,
            "revenue_lag_1": revenue.shift(1),
            "revenue_lag_12": revenue.shift(12),
            "revenue_rolling_mean_3": revenue.rolling(3, min_periods=3)
            .mean()
            .shift(1),
            "revenue_rolling_mean_12": revenue.rolling(12, min_periods=12)
            .mean()
            .shift(1),
        }
    )
    return features


def training_matrix(train: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """Return X, y, and the full feature frame (with NaN warmup rows dropped from X/y)."""
    featured = build_feature_frame(train)
    eligible = featured.dropna(subset=list(FEATURE_COLUMNS)).reset_index(drop=True)
    x = eligible.loc[:, list(FEATURE_COLUMNS)]
    y = eligible["revenue_usd"]
    return x, y, featured


def features_for_month(
    history: pd.DataFrame,
    target_month: pd.Timestamp,
    series_origin: pd.Timestamp,
) -> pd.DataFrame:
    """Construct a single-row feature vector for ``target_month`` from history only."""
    hist = history.sort_values("month").reset_index(drop=True)
    if target_month in set(hist["month"]):
        raise SalesForecastError(
            f"Target month {target_month.date()} already present in history; "
            "refusing to leak contemporaneous revenue."
        )

    placeholder = pd.DataFrame(
        {
            "month": [target_month],
            "revenue_usd": [np.nan],
            "active_contracts": [0],
            "avg_contract_value_usd": [1.0],
            "business_line": ["consolidated"],
        }
    )
    combined = pd.concat([hist, placeholder], ignore_index=True)
    featured = build_feature_frame(combined)
    # Recompute time_index relative to the full series origin (training start).
    row = featured.iloc[[-1]].copy()
    row["time_index"] = float(
        (target_month.year - series_origin.year) * 12
        + (target_month.month - series_origin.month)
    )
    if row[list(FEATURE_COLUMNS)].isna().any(axis=None):
        raise SalesForecastError(
            f"Incomplete features for {target_month.date()}; need longer history."
        )
    return row.loc[:, list(FEATURE_COLUMNS)]


# ---------------------------------------------------------------------------
# Model / OOF / recursive forecast
# ---------------------------------------------------------------------------


def make_random_forest(**overrides: Any) -> RandomForestRegressor:
    params = {**RF_PARAMS, **overrides}
    return RandomForestRegressor(**params)


def chronological_oof_predictions(
    x: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5,
) -> np.ndarray:
    """Chronological out-of-fold predictions entirely within the training period."""
    tscv = TimeSeriesSplit(n_splits=n_splits)
    oof = np.full(len(y), np.nan, dtype=float)
    for train_idx, val_idx in tscv.split(x):
        model = make_random_forest()
        model.fit(x.iloc[train_idx], y.iloc[train_idx])
        oof[val_idx] = model.predict(x.iloc[val_idx])
    if np.isnan(oof).all():
        raise SalesForecastError("OOF predictions are empty; check TimeSeriesSplit.")
    return oof


def fit_final_model(x: pd.DataFrame, y: pd.Series) -> RandomForestRegressor:
    model = make_random_forest()
    model.fit(x, y)
    return model


def recursive_forecast(
    model: RandomForestRegressor,
    train: pd.DataFrame,
    test_months: pd.Series,
) -> tuple[pd.DataFrame, list[float]]:
    """Fixed-origin recursive 24-month forecast.

    Appends model predictions (never test actuals) to the working history.
    Returns a predictions DataFrame and the list of predicted revenues used
    as recursive history (for leakage tests).
    """
    series_origin = train["month"].iloc[0]
    history = train[
        ["month", "revenue_usd", "active_contracts", "avg_contract_value_usd", "business_line"]
    ].copy()
    preds: list[float] = []
    months: list[pd.Timestamp] = []

    for month in test_months:
        month_ts = pd.Timestamp(month)
        x_row = features_for_month(history, month_ts, series_origin)
        pred = float(model.predict(x_row)[0])
        preds.append(pred)
        months.append(month_ts)
        history = pd.concat(
            [
                history,
                pd.DataFrame(
                    {
                        "month": [month_ts],
                        "revenue_usd": [pred],
                        "active_contracts": [0],
                        "avg_contract_value_usd": [1.0],
                        "business_line": ["consolidated"],
                    }
                ),
            ],
            ignore_index=True,
        )

    result = pd.DataFrame({"month": months, "prediction": preds})
    return result, preds


def seasonal_naive_forecast(train: pd.DataFrame, test: pd.DataFrame) -> np.ndarray:
    """12-month seasonal-naive from the Dec 2023 cutoff.

    Uses the last observed seasonal cycle (calendar year 2023 revenues) and
    repeats that cycle for both 2024 and 2025 without reading 2024 actuals
    when producing 2025 predictions.
    """
    cutoff_year = int(train["month"].max().year)
    year_mask = train["month"].dt.year == cutoff_year
    cycle = train.loc[year_mask]
    if len(cycle) != 12:
        raise SalesForecastError(
            f"Expected 12 months in cutoff year {cutoff_year}, found {len(cycle)}."
        )
    seasonal = {
        int(m): float(r)
        for m, r in zip(cycle["month"].dt.month, cycle["revenue_usd"], strict=True)
    }
    return test["month"].dt.month.map(seasonal).to_numpy(dtype=float)


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------


def regression_gini(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Deterministic regression Gini with stable sort on ties.

    Sorts by prediction descending (mergesort), then by original index for ties.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    n = len(y_true)
    if n == 0:
        return 0.0
    # lexsort: last key is primary; sort by -pred then original index.
    order = np.lexsort((np.arange(n), -y_pred))
    y_sorted = y_true[order]
    cumulative = np.cumsum(y_sorted)
    total = cumulative[-1]
    if total == 0:
        return 0.0
    gini_sum = cumulative.sum() / total - (n + 1) / 2.0
    return float(gini_sum / n)


def normalized_gini(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = regression_gini(y_true, y_true)
    if denom == 0:
        return 0.0
    return float(regression_gini(y_true, y_pred) / denom)


def population_stability_index(
    expected: np.ndarray,
    actual: np.ndarray,
    n_bins: int = 10,
    epsilon: float = PSI_EPSILON,
) -> float:
    """PSI using bin edges from the expected (train OOF) distribution only."""
    expected = np.asarray(expected, dtype=float)
    actual = np.asarray(actual, dtype=float)
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    if len(expected) == 0 or len(actual) == 0:
        raise SalesForecastError("PSI requires non-empty expected and actual arrays.")

    quantiles = np.linspace(0, 1, n_bins + 1)
    edges = np.unique(np.quantile(expected, quantiles))
    if len(edges) < 2:
        edges = np.array([expected.min() - 1e-9, expected.max() + 1e-9])

    exp_counts, _ = np.histogram(expected, bins=edges)
    act_counts, _ = np.histogram(actual, bins=edges)
    exp_pct = exp_counts.astype(float) / exp_counts.sum()
    act_pct = act_counts.astype(float) / act_counts.sum()
    exp_pct = np.where(exp_pct == 0, epsilon, exp_pct)
    act_pct = np.where(act_pct == 0, epsilon, act_pct)
    return float(np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct)))


def interpret_psi(psi: float) -> str:
    if psi < 0.10:
        return "stable"
    if psi <= 0.25:
        return "moderate shift"
    return "significant shift"


def compute_point_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    mean_rev = float(np.mean(y_true))
    return {
        "mse_usd2": mse,
        "rmse_usd": rmse,
        "nrmse_percent": (rmse / mean_rev) * 100.0 if mean_rev else float("nan"),
        "normalized_mse_percent": (mse / (mean_rev**2) * 100.0)
        if mean_rev
        else float("nan"),
        "mae_usd": float(mean_absolute_error(y_true, y_pred)),
        "r2": float(r2_score(y_true, y_pred)),
        "normalized_gini": normalized_gini(y_true, y_pred),
    }


def compute_k2(residuals: np.ndarray) -> dict[str, float]:
    statistic, pvalue = stats.normaltest(residuals)
    return {"k2_statistic": float(statistic), "k2_pvalue": float(pvalue)}


# ---------------------------------------------------------------------------
# Prediction intervals
# ---------------------------------------------------------------------------


def conformal_residual_quantile(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    coverage: float = CONFORMAL_COVERAGE,
) -> float:
    """Finite-sample absolute residual quantile for split-conformal intervals."""
    mask = ~np.isnan(y_pred)
    abs_resid = np.abs(np.asarray(y_true, dtype=float)[mask] - np.asarray(y_pred)[mask])
    n = len(abs_resid)
    if n == 0:
        raise SalesForecastError("No OOF residuals available for conformal calibration.")
    # Finite-sample correction: ceil((n+1)*coverage) / n quantile level
    q_level = min(1.0, np.ceil((n + 1) * coverage) / n)
    return float(np.quantile(abs_resid, q_level, method="higher"))


def apply_prediction_interval(
    predictions: np.ndarray,
    width: float,
    lower_floor: float = INTERVAL_LOWER_FLOOR,
) -> tuple[np.ndarray, np.ndarray]:
    preds = np.asarray(predictions, dtype=float)
    lower = np.maximum(preds - width, lower_floor)
    upper = preds + width
    return lower, upper


def interval_coverage(
    y_true: np.ndarray, lower: np.ndarray, upper: np.ndarray
) -> float:
    y_true = np.asarray(y_true, dtype=float)
    return float(np.mean((y_true >= lower) & (y_true <= upper)))


# ---------------------------------------------------------------------------
# Visualization / artifacts
# ---------------------------------------------------------------------------


def render_forecast_chart(
    test: pd.DataFrame,
    predictions: np.ndarray,
    lower: np.ndarray,
    upper: np.ndarray,
    output_path: str | Path,
) -> Path:
    """Save actuals vs predictions with shaded 90% interval (headless Agg)."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as mticker

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    months = pd.to_datetime(test["month"])
    actuals = test["revenue_usd"].to_numpy(dtype=float)

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.fill_between(
        months,
        lower,
        upper,
        color="#94a3b8",
        alpha=0.35,
        label="90% prediction interval",
    )
    ax.plot(months, actuals, color="#0f172a", linewidth=2, label="Actual revenue")
    ax.plot(
        months,
        predictions,
        color="#0369a1",
        linewidth=2,
        linestyle="--",
        label="Random Forest forecast",
    )
    ax.set_title(
        "Nexova consolidated revenue forecast (2024–2025)\n"
        "Captures Jan–Feb uplift and August slowdown vs actuals"
    )
    ax.set_xlabel("Month")
    ax.set_ylabel("Revenue (USD)")
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:,.0f}"))
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)
    fig.autofmt_xdate()
    fig.tight_layout()
    fig.savefig(out, dpi=140)
    plt.close(fig)
    return out


@dataclass
class PipelineResult:
    metrics: dict[str, Any]
    predictions: pd.DataFrame
    model: RandomForestRegressor
    artifact_dir: Path


def save_artifacts(
    artifact_dir: str | Path,
    model: RandomForestRegressor,
    metrics: dict[str, Any],
    predictions: pd.DataFrame,
    metadata: dict[str, Any],
    chart_path: Path,
) -> dict[str, Path]:
    out_dir = Path(artifact_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    model_path = out_dir / "model.joblib"
    metrics_path = out_dir / "metrics.json"
    preds_path = out_dir / "predictions.csv"
    meta_path = out_dir / "run_metadata.json"

    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    predictions.to_csv(preds_path, index=False)
    meta_path.write_text(json.dumps(metadata, indent=2, default=str), encoding="utf-8")

    return {
        "model": model_path,
        "metrics": metrics_path,
        "predictions": preds_path,
        "metadata": meta_path,
        "chart": chart_path,
    }


def run_sales_forecast_pipeline(
    csv_path: str | Path,
    artifact_dir: str | Path,
) -> PipelineResult:
    """End-to-end train / evaluate / persist pipeline."""
    raw = load_sales_csv(csv_path)
    validated = validate_sales_dataset(raw)
    train, test = split_train_test(validated)

    x_train, y_train, _ = training_matrix(train)
    oof = chronological_oof_predictions(x_train, y_train)
    model = fit_final_model(x_train, y_train)

    forecast_df, recursive_preds = recursive_forecast(model, train, test["month"])
    y_test = test["revenue_usd"].to_numpy(dtype=float)
    y_pred = np.asarray(recursive_preds, dtype=float)
    y_naive = seasonal_naive_forecast(train, test)

    rf_metrics = compute_point_metrics(y_test, y_pred)
    naive_metrics = compute_point_metrics(y_test, y_naive)
    residuals = y_test - y_pred
    k2 = compute_k2(residuals)

    oof_valid = oof[~np.isnan(oof)]
    # Align OOF with y for residual calibration (drop NaN OOF slots)
    oof_mask = ~np.isnan(oof)
    width = conformal_residual_quantile(
        y_train.to_numpy(dtype=float)[oof_mask],
        oof[oof_mask],
    )
    lower, upper = apply_prediction_interval(y_pred, width)
    coverage = interval_coverage(y_test, lower, upper)
    mean_width = float(np.mean(upper - lower))

    psi_value = population_stability_index(oof_valid, y_pred)

    beats_naive = rf_metrics["rmse_usd"] < naive_metrics["rmse_usd"]

    metrics: dict[str, Any] = {
        "random_forest": {
            **rf_metrics,
            **k2,
            "psi": psi_value,
            "psi_interpretation": interpret_psi(psi_value),
            "business_line_psi": "not_applicable",
            "business_line_psi_reason": "dataset contains only consolidated rows",
            "interval_coverage_90": coverage,
            "mean_interval_width_usd": mean_width,
            "conformal_width_usd": width,
        },
        "seasonal_naive": {
            "mse_usd2": naive_metrics["mse_usd2"],
            "rmse_usd": naive_metrics["rmse_usd"],
            "nrmse_percent": naive_metrics["nrmse_percent"],
            "r2": naive_metrics["r2"],
        },
        "benchmark_comparison": {
            "rf_beats_seasonal_naive_rmse": beats_naive,
            "recommend_dashboard_on_model_alone": beats_naive,
            "note": (
                "If Random Forest does not improve test RMSE over seasonal-naive, "
                "do not recommend dashboard deployment on the model alone."
            ),
        },
        "random_state": RANDOM_STATE,
        "model_params": RF_PARAMS,
        "model_justification": MODEL_JUSTIFICATION,
    }

    pred_table = pd.DataFrame(
        {
            "month": test["month"].dt.strftime("%Y-%m-%d"),
            "actual_revenue_usd": y_test,
            "rf_prediction_usd": y_pred,
            "seasonal_naive_usd": y_naive,
            "interval_lower_usd": lower,
            "interval_upper_usd": upper,
        }
    )

    out_dir = Path(artifact_dir)
    chart_path = render_forecast_chart(
        test, y_pred, lower, upper, out_dir / "forecast_2024_2025.png"
    )

    metadata = {
        "input_path": str(Path(csv_path)),
        "artifact_dir": str(out_dir),
        "validation_summary": {
            "rows": len(validated),
            "date_start": str(validated["month"].min().date()),
            "date_end": str(validated["month"].max().date()),
            "business_line": "consolidated",
        },
        "split": {
            "train_rows": len(train),
            "test_rows": len(test),
            "train_start": str(train["month"].min().date()),
            "train_end": str(train["month"].max().date()),
            "test_start": str(test["month"].min().date()),
            "test_end": str(test["month"].max().date()),
        },
        "feature_columns": list(FEATURE_COLUMNS),
        "scaling": "none (Random Forest does not require feature scaling)",
        "random_state": RANDOM_STATE,
        "model_params": RF_PARAMS,
        "model_justification": MODEL_JUSTIFICATION,
        "runtime_note": (
            "Host uv workflow only; not executed inside Compose backend/ui services."
        ),
        "recursive_forecast_used_predictions_not_test_actuals": True,
    }

    save_artifacts(out_dir, model, metrics, pred_table, metadata, chart_path)
    return PipelineResult(
        metrics=metrics,
        predictions=pred_table,
        model=model,
        artifact_dir=out_dir,
    )
