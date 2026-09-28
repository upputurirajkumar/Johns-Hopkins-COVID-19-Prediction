# Johns Hopkins COVID-19 Prediction & ML Forecasting Platform

Interactive epidemiological analysis and machine learning forecasting platform based on Johns Hopkins University CSSE COVID-19 time-series data (Project PRCP-1023).

## Features

- **Epidemic Dashboard**: Global & country-level KPIs (confirmed cases, active cases, recoveries, fatalities, case fatality rates, 7-day moving averages, doubling periods, and Rt reproduction numbers).
- **ML Prediction Lab**: Interactive implementation of 4 core regressors from the original project:
  - Linear Regression (OLS with Ridge Regularization)
  - Decision Tree Regressor
  - Random Forest Regressor
  - XGBoost Regressor (Gradient Boosted Decision Trees with Hyperparameter Tuning)
  - Live hyperparameter adjustment (test size ratio, lag window, tree depth, estimators, learning rate, feature toggles)
  - Comparative metrics leaderboard (MAE, RMSE, R², MAPE, training latency)
  - Actual vs Predicted regression curves with 95% confidence bands and residual diagnostics
- **Multi-Horizon Forecasting & Scenario Simulator**:
  - Multi-horizon forecasting (+7, +14, +30, +60, +90 days)
  - Interactive policy interventions (containment/lockdown strictness, mask compliance, daily vaccination rates, variant transmissibility, testing & contact tracing)
  - Projected healthcare burdens (inpatient hospital beds, ICU capacity, ventilators, daily liquid oxygen demand)
- **Data-Driven Healthcare & Policy Recommendations**: Priority action items for hospital readiness, genomic surveillance, testing scaling, and vulnerable population protection.
- **Exploratory Data Analysis (EDA)**: Log-Log epidemic trajectory curves, multi-country Day-0 outbreak alignments, CFR vs recovery rate scatter analysis, and feature correlation matrix.
- **Dataset Explorer**: Full tabular browser for raw & engineered time-series records with sorting, filtering, pagination, and CSV/JSON export.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Recharts (Interactive ComposedCharts, ScatterPlots, Area & Bar charts)
- Lucide React Icons
