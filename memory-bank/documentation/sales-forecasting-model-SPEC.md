# Nexova Sales Forecasting Model — Implementation Specification

## Purpose

Implement a reproducible Random Forest pipeline that trains on Nexova monthly
consolidated revenue from 2016–2023, forecasts the held-out 2024–2025 period,
calculates every required evaluation metric, and produces a prediction chart
with a variability range.

Read
[`sales-forecasting-model-CONTEXT.md`](./sales-forecasting-model-CONTEXT.md)
before implementation.

## Scope

The implementation must provide:

1. Dataset loading and validation.
2. An exact chronological 8-year / 2-year split.
3. Leakage-safe forecast feature construction.
4. Random Forest training with chronological validation.
5. A fixed-origin, recursive 24-month test forecast.
6. Seasonal-naive benchmark predictions.
7. Test-set MSE, PSI, normalized Gini, and K² results.
8. Supplemental RMSE, normalized RMSE, R², and interval coverage.
9. A chart of actual revenue, predictions, and a 90% interval.
10. A unit test validating the split and absence of date leakage.
11. Reproducible model and result artifacts.

No dashboard, API endpoint, scheduled job, or synthetic-data generation is in
scope.

## Required setup

- Work on a feature branch created from `main`.
- Verify `uv` with `uv --version`.
- If no applicable `pyproject.toml` exists, initialize one with `uv init`.
- Add dependencies using `uv add`; never use `pip install` or Pipenv.
- Expected direct dependencies:
  - `pandas`
  - `numpy`
  - `scikit-learn`
  - `scipy`
  - `matplotlib`
  - `joblib` if model persistence does not rely on the copy exposed by
    scikit-learn
- Add test dependencies with the repository’s existing `uv` convention.

The implementing agent must inspect the current repository environment before
changing dependency files and preserve unrelated worktree changes.

## Inputs

Default input path:

```text
data/raw/nexova_sales.csv
```

Required columns:

| Column | Required type | Use |
|---|---|---|
| `month` | Date parseable as `YYYY-MM-01` | Ordering and calendar features |
| `revenue_usd` | Positive float | Regression target |
| `active_contracts` | Non-negative integer | Validation/diagnostic; no contemporaneous use |
| `avg_contract_value_usd` | Positive float | Validation/diagnostic; no contemporaneous use |
| `business_line` | String | Must be `consolidated`; not a model feature |

Do not modify, replace, or regenerate the raw CSV.

## Data validation

Fail with an actionable error when:

- A required column is absent.
- A required value is null or empty after parsing.
- A month is duplicated.
- Any month from January 2016 through December 2025 is missing.
- Dates are outside the expected range.
- Revenue is non-positive.
- The row count is not 120.
- A row is not `consolidated`.

Sort by `month` only after detecting duplicates. Validation must happen before
training.

## Split contract

Expose the split as a testable function rather than embedding it only in CLI
code.

```text
train: month < 2024-01-01
test:  month >= 2024-01-01
```

Required assertions:

- Training has 96 rows.
- Test has 24 rows.
- Training begins `2016-01-01` and ends `2023-12-01`.
- Test begins `2024-01-01` and ends `2025-12-01`.
- `max(train.month) < min(test.month)`.
- Training and test month sets are disjoint.

The row-count assertions apply to the validated raw split before lag features
remove early training rows.

## Feature engineering

Create features without fitting or inspecting test targets:

- `time_index`
- Month-of-year one-hot encoding or sine/cosine pair
- `revenue_lag_1`
- `revenue_lag_12`
- `revenue_rolling_mean_3`, shifted by one month
- `revenue_rolling_mean_12`, shifted by one month

Rules:

- Every rolling feature must be shifted so the current target is excluded.
- The feature schema and ordering must be centralized.
- Do not include raw `month`, `business_line`, current `revenue_usd`,
  current `active_contracts`, or current `avg_contract_value_usd`.
- Random Forest does not require feature scaling. Document this rather than
  introducing a scaler.
- If lagged operational features are later added, tests must prove their
  values were available at the applicable forecast origin.

## Benchmark

Generate a 12-month seasonal-naive forecast using only values known at the
December 2023 cutoff.

For the fixed-origin 24-month evaluation, do not substitute actual 2024 revenue
when generating 2025 benchmark predictions. Document the exact repetition
rule in code.

Report benchmark MSE, RMSE, normalized RMSE, and R² next to the Random Forest
results.

## Model

Use:

```python
from sklearn.ensemble import RandomForestRegressor

RandomForestRegressor(
    n_estimators=300,
    max_depth=5,
    min_samples_leaf=3,
    max_features=0.8,
    bootstrap=True,
    random_state=42,
    n_jobs=-1,
)
```

This is the initial parameter set, not permission to tune against the test
period.

If parameters are tuned:

- Use expanding-window validation within 2016–2023.
- Use an appropriate `TimeSeriesSplit`.
- Select parameters by validation RMSE.
- Keep the search intentionally small for the 96-row dataset.
- Persist the selected values.
- Never select parameters, features, or interval width based on 2024–2025
  results.

## Recursive test forecast

Fit the final model on the complete eligible training feature set. Starting
from the December 2023 cutoff:

1. Construct January 2024 features from training history.
2. Predict January 2024.
3. Append that prediction to the forecast history.
4. Construct February 2024 features from the updated history.
5. Continue through December 2025.

The actual test target may be joined only after all predictions are generated.
Add a guard or test that prevents actual test revenue from entering recursive
history.

## Required metrics

Calculate all primary metrics on the 24 test predictions, never on training
predictions.

### MSE

Use `sklearn.metrics.mean_squared_error`. Report:

- `mse_usd2`
- `rmse_usd`
- `nrmse_percent = rmse / mean(y_test) * 100`
- Optional literal normalization:
  `normalized_mse_percent = mse / mean(y_test) ** 2 * 100`

### Gini

Implement and test normalized regression Gini:

```text
normalized_gini = gini(y_test, y_pred) / gini(y_test, y_test)
```

The implementation must define sorting and tie behavior deterministically.
Document that Gini measures ranking/discrimination, complementing magnitude
error.

### PSI

Produce chronological out-of-fold predictions for the training period. Compare
their distribution with the final test prediction distribution:

1. Derive bin edges from training out-of-fold prediction quantiles.
2. Deduplicate bin edges when necessary.
3. Apply the same edges to both populations.
4. Replace zero proportions with a small documented epsilon.
5. Sum `(actual_pct - expected_pct) * log(actual_pct / expected_pct)`.

Report the numeric PSI and its interpretation. Also report:

```text
business_line_psi: not_applicable
reason: dataset contains only consolidated rows
```

### K² Score

Use `scipy.stats.normaltest` on:

```text
residuals = y_test - y_pred
```

Report both:

- `k2_statistic`
- `k2_pvalue`

Document that this evaluates residual normality; it is not an accuracy score.
The test set has 24 observations, which is sufficient for the function’s
minimum sample requirement.

### Supplemental metrics

Also report:

- R²
- Mean absolute error
- 90% interval coverage
- Mean interval width

The implementation documentation or training-script comments must explain what
each required metric measures and why low MSE alone is insufficient. In
particular, low MSE does not establish ranking quality, distribution stability,
residual behavior, or calibrated uncertainty.

## Prediction interval

Use a 90% split-conformal-style interval calibrated from absolute
chronological out-of-fold residuals within the training period.

- Compute the finite-sample 90th-percentile residual quantile.
- Apply the calibrated width to each final point prediction.
- Clip interval lower bounds to a small positive value.
- Do not calibrate interval width using test residuals.
- Plot the interval as a shaded band.
- Report empirical test coverage without retuning the interval.

## Visualization

Generate a static chart for January 2024 through December 2025 containing:

- Actual `revenue_usd`.
- Random Forest point predictions.
- Shaded 90% prediction interval.
- Clearly labelled month axis.
- Revenue axis formatted in USD.
- Legend and descriptive title.
- Readable rendering of the January–February peaks and August slowdowns.

The variability band is mandatory; a point-estimate-only chart fails the
evaluation.

## Suggested implementation boundaries

The training code should expose independently testable functions for:

- Loading the CSV.
- Validating the dataset.
- Creating the 8/2 split.
- Building training features.
- Running chronological validation.
- Fitting the final Random Forest.
- Producing the recursive forecast.
- Producing the seasonal-naive benchmark.
- Calculating each metric.
- Calibrating prediction intervals.
- Saving artifacts and rendering the chart.

The required entrypoint belongs under `scripts/`. Keep reusable logic out of a
single monolithic CLI function if the repository already has an appropriate
domain or pipeline module boundary.

Suggested invocation:

```text
uv run python scripts/train_sales_forecast.py
```

Suggested test invocation:

```text
uv run pytest tests/pipelines/test_sales_forecast_split.py
```

Exact artifact directories may follow established repository conventions, but
the run must produce:

- Serialized trained model.
- Machine-readable metrics.
- Test predictions and interval bounds.
- Forecast visualization.
- Parameters and random seed.

Generated artifacts must not overwrite raw data.

## Required tests

At minimum, add:

```text
tests/pipelines/test_sales_forecast_split.py
```

It must verify:

- The 96/24 row counts.
- Exact date boundaries.
- No overlap.
- Chronological ordering.
- No actual test targets are used in training.

Recommended additional tests:

- Dataset schema and complete monthly range.
- Shifted rolling features exclude the current target.
- Recursive forecast history contains predictions rather than test actuals.
- Deterministic output with `random_state=42`.
- Gini behavior for perfect and reversed rankings.
- PSI stability for identical distributions.
- Positive interval lower bounds.

## Evaluation checklist

The following items reproduce the supplied evaluation requirements and are all
mandatory:

- [ ] The training/test split respects the 8-year / 2-year rule.
- [ ] Training and test data are never mixed.
- [ ] The trained learning model is Random Forest.
- [ ] The model choice is explicitly justified using dataset size,
      explainability needs, and tuning constraints.
- [ ] MSE is calculated and reported on the test set.
- [ ] PSI is calculated and reported on the test set comparison.
- [ ] Normalized Gini is calculated and reported on the test set.
- [ ] K² statistic and p-value are calculated from test residuals.
- [ ] Metric documentation explains each metric and why low MSE alone is
      insufficient.
- [ ] A visualization compares predictions with actual test data.
- [ ] The visualization includes a prediction-variability range.
- [ ] The implementation uses `data/raw/nexova_sales.csv`.
- [ ] The source dataset is not modified or replaced.
- [ ] Column names and context-specific values match the supplied context.
- [ ] The original growth and seasonality patterns remain intact.
- [ ] `random_state=42` is fixed and reported.
- [ ] The split/leakage unit test under `tests/pipelines/` passes.
- [ ] Dependencies are managed with `uv`, not pip or Pipenv.

## Acceptance evidence

| Requirement | Expected evidence |
|---|---|
| Correct source data | Logged input path and validation summary |
| 8/2 split | Test assertions and run metadata with dates/counts |
| No leakage | Recursive forecast test and no test-target access before evaluation |
| Random Forest choice | Code comment/docstring and run metadata |
| Four required metrics | Machine-readable test metrics output |
| Metric explanations | Training-script documentation or accompanying README |
| Variability visualization | Saved chart with shaded 90% interval |
| Reproducibility | Fixed seed and persisted parameters |
| Benchmark comparison | Seasonal-naive and forest metrics side by side |

## Handoff completion criteria

The implementation is ready for review when:

1. The required training command completes successfully from a clean checkout.
2. The split test and all new focused tests pass.
3. The model and benchmark are evaluated only on the held-out period.
4. Every evaluation checklist item has inspectable evidence.
5. The chart contains actuals, predictions, and the 90% interval.
6. The result clearly states whether Random Forest beat the seasonal-naive
   benchmark.
7. Lint, typecheck where applicable, and relevant tests pass under repository
   governance.
