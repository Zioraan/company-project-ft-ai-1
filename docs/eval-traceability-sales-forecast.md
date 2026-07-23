# Eval Traceability — Sales Forecasting Model

Evidence matrix for [`sales-forecasting-model-SPEC.md`](../memory-bank/documentation/sales-forecasting-model-SPEC.md).

## Runtime boundary

| Item | Evidence |
|------|----------|
| Host `uv` training (not Compose backend) | `scripts/train_sales_forecast.py` docstring; `run_metadata.json` `runtime_note` |
| API Docker requirements unchanged | `services/api/requirements.txt` has no scikit-learn/matplotlib |
| No FastAPI import of forecast module | No matches under `services/api/app/` |

## Checklist

| ID | Requirement | Evidence | Status |
|----|-------------|----------|--------|
| SF-01 | 8/2 chronological split | `tests/pipelines/test_sales_forecast_split.py`; `split_train_test` | Pass |
| SF-02 | Train/test never mixed | Split disjoint tests; recursive history uses predictions | Pass |
| SF-03 | Random Forest model | `RandomForestRegressor` in `domain/sales_forecast.py` | Pass |
| SF-04 | Model choice justified | `MODEL_JUSTIFICATION` + `run_metadata.json` | Pass |
| SF-05 | MSE on test set | `metrics.json` → `random_forest.mse_usd2` | Pass |
| SF-06 | PSI reported | `metrics.json` → `psi` + interpretation; business-line N/A | Pass |
| SF-07 | Normalized Gini on test | `metrics.json` → `normalized_gini`; unit tests | Pass |
| SF-08 | K² on test residuals | `k2_statistic` / `k2_pvalue` via `scipy.stats.normaltest` | Pass |
| SF-09 | Metric documentation | CLI + domain module docstrings | Pass |
| SF-10 | Visualization with actuals | `data/artifacts/sales_forecast/forecast_2024_2025.png` | Pass |
| SF-11 | Variability range (90% interval) | Shaded band + `interval_*` columns in `predictions.csv` | Pass |
| SF-12 | Source CSV `data/raw/nexova_sales.csv` | Default CLI path; validation summary | Pass |
| SF-13 | Dataset not modified | Load-only; no write to raw path | Pass |
| SF-14 | Column/context match | Validation enforces schema + consolidated only | Pass |
| SF-15 | `random_state=42` | `RF_PARAMS` + metrics/metadata | Pass |
| SF-16 | Split/leakage unit tests | `tests/pipelines/` (13 tests) | Pass |
| SF-17 | Dependencies via `uv` | Root `pyproject.toml` + `uv.lock` | Pass |
| SF-18 | Seasonal-naive benchmark | `metrics.json` → `seasonal_naive` + CLI verdict | Pass |

## Commands

```text
uv run python scripts/train_sales_forecast.py
uv run pytest tests/pipelines/ -q
```

## Sample run (2026-07-23)

- RF test RMSE ≈ $55,499 (nRMSE ≈ 5.79%); seasonal-naive RMSE ≈ $70,097
- RF beats seasonal-naive on test RMSE
- 90% interval empirical coverage ≈ 91.67%
- Normalized Gini ≈ 0.82
