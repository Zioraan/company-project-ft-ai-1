#!/usr/bin/env python3
"""Train and evaluate the Nexova sales forecasting Random Forest.

Runtime
-------
Host workflow only::

    uv run python scripts/train_sales_forecast.py

Do not run this inside the Compose ``backend`` container. That image mounts
only ``services/api`` and does not install scikit-learn/matplotlib. The CSV and
artifact paths live under repo-root ``data/``, which is not mounted there.

Metrics (why low MSE alone is insufficient)
-------------------------------------------
- **MSE / RMSE / nRMSE%**: magnitude error in USD (and RMSE as % of mean revenue).
  Low MSE does not prove ranking quality, distribution stability, or calibrated
  uncertainty.
- **Normalized Gini**: discrimination — can the model rank slow vs strong months
  (e.g. August vs January)? Complements magnitude error.
- **PSI**: stability of the prediction distribution (train OOF vs test preds).
  Business-line PSI is N/A (consolidated-only dataset).
- **K² (D’Agostino normaltest)**: residual normality statistic + p-value — not an
  accuracy score.
- **90% conformal interval**: uncertainty band calibrated on train OOF residuals
  only; report empirical test coverage separately.

Release rule: recommend dashboard use only if Random Forest beats the
seasonal-naive benchmark on test RMSE.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.sales_forecast import (  # noqa: E402
    SalesForecastError,
    run_sales_forecast_pipeline,
)

DEFAULT_CSV = ROOT_DIR / "data" / "raw" / "nexova_sales.csv"
DEFAULT_ARTIFACTS = ROOT_DIR / "data" / "artifacts" / "sales_forecast"


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")


def _print_summary(result) -> None:
    metrics = result.metrics
    rf = metrics["random_forest"]
    naive = metrics["seasonal_naive"]
    cmp_ = metrics["benchmark_comparison"]

    print("=== Nexova sales forecast ===")
    print(f"Artifacts: {result.artifact_dir}")
    print()
    print("Random Forest (test set)")
    print(f"  MSE (USD^2):           {rf['mse_usd2']:,.2f}")
    print(f"  RMSE (USD):            {rf['rmse_usd']:,.2f}")
    print(f"  nRMSE (% of mean):     {rf['nrmse_percent']:.2f}%")
    print(f"  Normalized Gini:       {rf['normalized_gini']:.4f}")
    print(f"  PSI:                   {rf['psi']:.4f} ({rf['psi_interpretation']})")
    print(f"  Business-line PSI:     {rf['business_line_psi']}")
    print(f"  K2 statistic:          {rf['k2_statistic']:.4f}")
    print(f"  K2 p-value:            {rf['k2_pvalue']:.4f}")
    print(f"  R^2:                   {rf['r2']:.4f}")
    print(f"  90% interval coverage: {rf['interval_coverage_90']:.2%}")
    print(f"  Mean interval width:   ${rf['mean_interval_width_usd']:,.2f}")
    print()
    print("Seasonal-naive benchmark (test set)")
    print(f"  MSE (USD^2):           {naive['mse_usd2']:,.2f}")
    print(f"  RMSE (USD):            {naive['rmse_usd']:,.2f}")
    print(f"  nRMSE (% of mean):     {naive['nrmse_percent']:.2f}%")
    print(f"  R^2:                   {naive['r2']:.4f}")
    print()
    if cmp_["rf_beats_seasonal_naive_rmse"]:
        print(
            "Verdict: Random Forest BEATS seasonal-naive on test RMSE "
            "(dashboard recommendation contingent on stakeholder review)."
        )
    else:
        print(
            "Verdict: Random Forest does NOT beat seasonal-naive on test RMSE. "
            "Do not recommend dashboard deployment on the model alone."
        )
    print(f"random_state={metrics['random_state']}")


def main() -> int:
    _configure_stdout()
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    artifact_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_ARTIFACTS

    try:
        result = run_sales_forecast_pipeline(csv_path, artifact_dir)
    except SalesForecastError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: Unexpected failure: {exc}", file=sys.stderr)
        return 1

    _print_summary(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
