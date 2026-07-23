# Nexova Sales Forecasting Model — Handoff Context

## Status

Approved for implementation.

This document records the business context and decisions already made for the
Nexova sales-forecasting feature. The implementation specification is in
[`sales-forecasting-model-SPEC.md`](./sales-forecasting-model-SPEC.md).

## Source material

- Company and dataset context:
  [`sales-forcasting-CONTEXT.md`](./sales-forcasting-CONTEXT.md)
- Raw dataset:
  [`../../data/raw/nexova_sales.csv`](../../data/raw/nexova_sales.csv)
- Evaluation requirements supplied with the handoff:
  - Use the provided company dataset without regenerating or altering it.
  - Use an 8-year training / 2-year test split with no leakage.
  - Train either XGBoost or Random Forest and justify the choice.
  - Calculate MSE, PSI, Gini, and K2 Score on the test set.
  - Plot predictions, actuals, and a variability range over the test period.
  - Fix the random seed.
  - Add a split/leakage unit test under `tests/pipelines/`.

## Business objective

Nexova wants to determine whether monthly consolidated revenue can be forecast
well enough to support future budgeting and an executive dashboard. The model
must capture the recurring January–February increase, the August slowdown, and
the long-term growth pattern while remaining understandable to Finance.

## Dataset facts

The supplied CSV contains:

- 120 monthly observations.
- January 2016 through December 2025, inclusive.
- One row per month with no expected gaps.
- Only the `consolidated` business line.
- Target: `revenue_usd`.
- Candidate operational fields:
  - `active_contracts`
  - `avg_contract_value_usd`

The required chronological split is:

| Partition | Date range | Expected rows |
|---|---|---:|
| Training | 2016-01-01 through 2023-12-01 | 96 |
| Test | 2024-01-01 through 2025-12-01 | 24 |

The data exhibits alternating annual growth near 1% and 7%, January–February
uplift, and an August decline.

## Decisions already made

### Learning model

Use `sklearn.ensemble.RandomForestRegressor`.

Random Forest was selected because:

- The training sample contains only 96 monthly rows.
- The important relationships are nonlinear but structurally simple.
- Finance needs an explanation that does not depend on boosting internals.
- Conservative tree depth and leaf size can reduce overfitting.
- It requires no feature scaling.
- It works with a separately calibrated prediction interval.

Use this initial configuration:

```python
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

Any tuning must use chronological validation contained entirely within the
training period. XGBoost is an optional future challenger, not part of the
required first implementation.

### Benchmark

Use a 12-month seasonal-naive forecast as the primary benchmark. For a strict
fixed-origin forecast made at the end of 2023, repeat the last observed seasonal
cycle without reading actual 2024 values while forecasting 2025.

A trend-plus-month linear regression may be reported as a secondary benchmark.

### Forecast protocol

The main evaluation is a fixed-origin, 24-month forecast made from information
available through December 2023.

- Predictions must be generated chronologically.
- Actual 2024–2025 revenue must never be used to construct later test features.
- When a revenue lag reaches into the test period, use the earlier model
  prediction, not the actual test value.
- Do not shuffle the dataset.

### Leakage decision

`active_contracts * avg_contract_value_usd` nearly reconstructs
`revenue_usd`. Same-month contract values therefore must not be used as
predictors for the main forward forecast unless the implementation can prove
they are known before the revenue forecast is issued.

For the initial implementation, exclude contemporaneous contract fields from
the main model. Lagged operational values may only be included when their
availability at every forecast origin is explicit and they do not reveal test
period information.

### Proposed forecast features

Use only features that can be produced at the forecast cutoff:

- Month-of-year encoding.
- Sequential month index.
- Revenue lag 1.
- Revenue lag 12.
- Trailing 3-month revenue average.
- Trailing 12-month revenue average.

Feature construction must be identical during training and recursive test
forecasting. `business_line` is constant and should be excluded.

### Evaluation metric definitions

All required model metrics are calculated on the 24-row test set.

- **MSE:** Mean squared error in USD².
- **RMSE:** Square root of MSE in USD, reported as an additional
  finance-friendly metric.
- **Normalized RMSE:** `RMSE / mean(actual test revenue) * 100`.
- **Gini:** Normalized regression Gini:
  `Gini(actual, prediction) / Gini(actual, actual)`.
- **PSI:** Numeric population stability index comparing the distribution of
  chronological training out-of-fold predictions with test predictions. Use
  bins derived only from the training prediction distribution and a documented
  epsilon for empty bins. Business-line PSI is reported as not applicable
  because every row is `consolidated`.
- **K2 Score:** D’Agostino’s K² normality statistic calculated on test
  residuals, together with its p-value. This definition must be stated because
  “K2 Score” is otherwise ambiguous.
- **R²:** Report as a supplemental metric in case the originating requirement
  intended R² rather than K².

Do not describe MSE itself as a percentage of revenue because it is measured in
USD². Use normalized RMSE for the percentage interpretation. If needed for
literal traceability, also report `MSE / mean(actual test revenue)²`.

### Variability range

Plot a 90% conformal prediction interval around each point forecast.

Calibrate the interval using absolute residuals from chronological,
out-of-fold predictions produced only within the training period. Clip the
lower bound above zero because the business context requires positive revenue.
Report empirical interval coverage on the test period.

### Reproducibility

Use `random_state=42` for the model, tuning, and any other stochastic step.
Persist the chosen parameters alongside the metrics.

## Finance-facing explanation

> The model builds many small decision trees that compare a future month with
> similar historical conditions, including its season and recent revenue
> pattern. The trees are averaged to reduce reliance on any single historical
> example. The forecast also includes a calibrated range to show uncertainty
> rather than presenting one number as certain.

## Interpretation and release rule

The Random Forest must be compared with the seasonal-naive benchmark. Passing
the mechanical evaluation requirements does not by itself prove business
value. If the forest does not improve test RMSE over the seasonal benchmark,
report that result honestly and do not recommend dashboard deployment on the
basis of the model alone.

No fixed business acceptance thresholds were supplied. Use the following PSI
labels as documented interpretation guidance:

- `< 0.10`: stable
- `0.10–0.25`: moderate shift
- `> 0.25`: significant shift
