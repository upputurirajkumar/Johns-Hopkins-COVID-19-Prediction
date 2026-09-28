# Johns Hopkins COVID-19 Prediction — Interactive Data Science Platform

An enterprise-grade, interactive Data Science & Machine Learning platform built with **HTML5, CSS3, and Vanilla JavaScript** based on the official Johns Hopkins University CSSE COVID-19 dataset (Project PRCP-1023).

---

## 🌟 Key Platform Capabilities

1. **Executive Overview**: Animated KPI counters for Global and 188 country regions, 8-stage data science lifecycle visualizer, and project metadata.
2. **Data Explorer & Quality Audit**: Full dataset shape explorer (266 rows × 248 columns), missing value audit, wide-to-long unpivoting pipeline, and an interactive searchable/paginated data preview table.
3. **Global COVID Analytics**: Interactive time-series charts (7-day moving averages, daily waves, cumulative counts), Log-Log epidemic trajectories, Day-0 outbreak alignments (normalized at 1,000 cases), CFR vs Recovery scatter analysis, and Pearson correlation matrices.
4. **Feature Engineering Lab**: Signal extraction pipeline converting raw time series into Lag features (Lag-1, Lag-7, Lag-14), 7-day rolling statistics, and velocity derivatives.
5. **Machine Learning Model Lab**: Full interactive evaluation of 4 core regressors from the project:
   - **Linear Regression (OLS Baseline)**
   - **Decision Tree Regressor**
   - **Random Forest Regressor**
   - **XGBoost Regressor (Tuned)**
   - Displays MAE, RMSE, $R^2$, MAPE, actual vs predicted fit, feature importance rankings, and residual scatter diagnostics.
6. **Model Optimization**: Detailed breakdown of RandomizedSearchCV (5-fold TimeSeriesSplit) search parameters, optimal parameters, and before-vs-after error reduction comparisons (-50.4% MAE reduction).
7. **30-Day Forecast Studio**: Forward projection for India (and comparator nations) from September 22 through October 21, 2020, with 95% confidence intervals, searchable daily projections table, healthcare burden estimations (ICU beds, ventilators, medical oxygen), and a policy scenario simulator.
8. **Decision Intelligence**: Translational public health matrix covering ICU surge capacity, sentinel wastewater surveillance, vulnerable group shielding, and targeted containment policies.
9. **Methodology & Limitations**: Scientific audit of ascertainment biases, regression boundaries, and future SEIR compartmental integration.
10. **Dark / Light Theme**: Built-in dynamic theme switcher and responsive layout for mobile, tablet, and desktop screens.

---

## 🗂️ Project File Structure

```
.
├── index.html                  # Master Semantic HTML5 SPA
├── css/
│   ├── style.css               # Design System, Glassmorphism, CSS Custom Properties
│   └── responsive.css          # Mobile & Tablet Media Queries
├── js/
│   ├── app.js                  # Main Application Orchestrator & Router
│   ├── charts.js               # Dynamic Chart.js Manager & Custom Tooltips
│   ├── ui.js                   # Animated Counters, Modals, Theme Switcher, CSV Export
│   ├── analytics.js            # Global Trends, Day-0 Alignment, CFR Scatter, Correlation Matrix
│   ├── feature-lab.js          # Feature Engineering Pipeline Visualizer
│   ├── models.js               # ML Models Evaluator, Leaderboard & Residuals
│   ├── optimization.js         # Hyperparameter Search Space & Before/After Delta
│   ├── forecast.js             # 30-Day Forward Forecast Studio & Healthcare Load Calculator
│   └── decision.js             # Decision Intelligence & Policy Action Matrix
├── data/
│   ├── project-data.js         # Metadata, Data Quality Audits & Feature Dictionary
│   ├── covid-data.js           # Time-Series Datasets for Global & Key Nations (1/22/20 - 9/21/20)
│   ├── model-results.js        # Model Metrics (MAE, RMSE, R²), Residuals & Parameter Grids
│   └── forecast-data.js        # 30-Day Daily Projections & Healthcare Demand Factors
├── package.json                # Local dev server configuration
└── README.md                   # Platform documentation
```

---

## 🚀 Running Locally

### Option 1: Direct Browser Launch (No Build Tool Required)
Simply double-click `index.html` or open it directly in any modern browser (Chrome, Firefox, Safari, Edge).

### Option 2: Using Node / Vite Dev Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 3: Using Python HTTP Server
```bash
python3 -m http.server 3000
```

---

## 🌐 Deploying as a Static Website

### Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Navigate to **Settings** > **Pages**.
3. Under **Source**, select **Deploy from a branch** and choose the `main` branch (root `/`).
4. Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/`.

### Deploying to Vercel
1. Install Vercel CLI via `npm i -g vercel` or link your GitHub repository on [Vercel Dashboard](https://vercel.com).
2. Run `vercel` in the project root.
3. Select defaults (Framework Preset: **Other** / Static).
4. Your application will deploy instantly with global CDN caching.
