# Sales Forecast — Model Selection Analysis Plan

Collaborative notebook workflow to decide which forecasting model to keep
(or promote) for Nexova monthly consolidated revenue.

## Goal

Compare candidates on leakage-safe features and the required KPIs (MSE,
normalized Gini, PSI, K²), with seasonal-naive as the deploy gate. Produce a
documented model choice for Laura / Marcos.

## Notebook format

`notebooks/sales_forecast_model_selection.ipynb` follows the GeeksforGeeks-style
EDA Jupyter flow:

1. Import libraries
2. Load dataset
3. Data analysis (head/tail/shape/info/describe/duplicates)
4. Data preparation (nulls, validate, split, features)
5. EDA visualisation (line, bar, YoY, scatter, heatmap)
6. Model building (candidates + decision rules)
7. Train / score / chart
8. Conclusion + decision log

Guide reference:
https://www.geeksforgeeks.org/data-analysis/quick-guide-to-exploratory-data-analysis-using-jupyter-notebook/

## Decision criteria

1. **Accuracy gate:** test RMSE must beat seasonal-naive (same 8/2 split).
2. **Discrimination:** high normalized Gini (separate slow August from true drops).
3. **Stability:** report PSI; interpret train→test prediction shift.
4. **Residual sanity:** K² on residuals (normality diagnostic, not accuracy).
5. **Fit to data size:** ~96 train months — prefer simple/regularized models over
   heavily tuned boosters unless they clearly win.
6. **Explainability:** Finance-facing preference for interpretable ensembles when
   metrics are close.

## Candidates in scope

| Candidate | Why consider |
|-----------|----------------|
| Seasonal-naive (lag-12) | Deploy gate / baseline |
| Holt-Winters (ETS) | Traditional seasonal time-series; trend + period-12 |
| Linear / Ridge (calendar + lags) | Simple trend + seasonality check |
| Random Forest | Current production candidate in `sales_forecast.py` |
| XGBoost (optional challenger) | Spec allows RF or XGBoost; only if RF is weak |

## Status

Notebook restructured to GFG EDA format. User walkthrough of Steps 1–7 pending
for final model decision.
