/**
 * PRCP-1023 Johns Hopkins COVID-19 Prediction
 * Authoritative Project Metadata & Documentation
 */

const PROJECT_META = {
  id: "PRCP-1023",
  title: "Johns Hopkins COVID-19 Prediction",
  subtitle: "From Global Pandemic Data to Machine Learning Forecasts",
  source: "Johns Hopkins University Center for Systems Science and Engineering (JHU CSSE)",
  period: "January 22, 2020 – September 21, 2020 (244 Days)",
  objective: "Analyze epidemiological time-series patterns and engineer machine learning predictive models (Linear Regression, Decision Trees, Random Forest, XGBoost) with hyperparameter optimization to generate accurate multi-step case forecasts for national and global pandemic trajectory planning.",
  problemStatement: "The rapid progression of the SARS-CoV-2 pandemic necessitated robust mathematical and data-driven forecasting tools to anticipate infection waves, estimate healthcare resource needs, and evaluate public health interventions. This project leverages the gold-standard JHU CSSE dataset to build an end-to-end data science and regression pipeline.",
  targetVariable: "Confirmed COVID-19 Cases (Cumulative and Daily New Incidences)",
  
  datasetSummary: {
    files: [
      { name: "time_series_covid19_confirmed_global.csv", description: "Daily cumulative confirmed cases worldwide", rows: 266, cols: 248 },
      { name: "time_series_covid19_deaths_global.csv", description: "Daily cumulative recorded fatalities", rows: 266, cols: 248 },
      { name: "time_series_covid19_recovered_global.csv", description: "Daily cumulative reported recoveries", rows: 253, cols: 248 }
    ],
    totalGlobalConfirmed: 31252119,
    totalGlobalDeaths: 963690,
    totalGlobalRecovered: 21396841,
    totalGlobalActive: 8891588,
    globalCFR: "3.08%",
    globalRecoveryRate: "68.47%",
    totalCountriesTracked: 188,
    totalDatePoints: 244
  },

  dataQuality: {
    missingValues: {
      provinceState: { missingCount: 185, totalCount: 266, percentage: 69.5, status: "Handled (Aggregated by Country/Region)", level: "warning" },
      countryRegion: { missingCount: 0, totalCount: 266, percentage: 0.0, status: "Clean (0 missing)", level: "healthy" },
      latLong: { missingCount: 2, totalCount: 266, percentage: 0.75, status: "Imputed with country centroids", level: "healthy" },
      timeSeriesDates: { missingCount: 0, totalCount: 244, percentage: 0.0, status: "Strictly Monotonic Time-Series", level: "healthy" }
    },
    duplicates: { count: 0, status: "0 Duplicate Rows", level: "healthy" },
    dataTypes: [
      { column: "Province/State", originalType: "object", cleanedType: "string (categorical)" },
      { column: "Country/Region", originalType: "object", cleanedType: "string (categorical)" },
      { column: "Lat", originalType: "float64", cleanedType: "float64 (geographical)" },
      { column: "Long", originalType: "float64", cleanedType: "float64 (geographical)" },
      { column: "Date Columns (1/22/20...9/21/20)", originalType: "int64", cleanedType: "Datetime unpivoted to continuous sequence" }
    ],
    cleaningSteps: [
      { step: 1, title: "Unpivoting (Melting) Wide-to-Long", desc: "Converted wide matrix containing 244 date columns into relational long-format time series (Date, Country, Value)." },
      { step: 2, title: "Country-Level Grouping & Aggregation", desc: "Aggregated multi-province entities (e.g. Australia, Canada, China, UK overseas territories) into unified national time series." },
      { step: 3, title: "Derived Epidemiological Metrics", desc: "Engineered Active Cases = Confirmed - Deaths - Recovered, Daily New Cases via first-order difference, Case Fatality Rate (CFR), and 7-day moving averages." },
      { step: 4, title: "Outlier & Monotonicity Auditing", desc: "Validated negative reporting corrections and normalized historical retrospective adjustments using 7-day rolling window smoothing." }
    ]
  },

  featureDictionary: [
    { name: "Day_Index", type: "Integer (Temporal)", desc: "Ordinal count of elapsed days since first observation date (t = 0 for Jan 22, 2020).", purpose: "Captures macro temporal trend and baseline epidemic progression." },
    { name: "Lag_1", type: "Continuous (Cases)", desc: "Confirmed case count at previous time step (t - 1).", purpose: "Highest direct autocorrelation signal for immediate next-day state." },
    { name: "Lag_7", type: "Continuous (Cases)", desc: "Confirmed case count exactly 7 days prior (t - 7).", purpose: "Captures weekly cyclical reporting periodicity and serial interval transmission." },
    { name: "Lag_14", type: "Continuous (Cases)", desc: "Confirmed case count 14 days prior (t - 14).", purpose: "Reflects full viral incubation and symptomatic reporting horizon." },
    { name: "Rolling_7_Mean", type: "Continuous (Statistical)", desc: "7-day backward moving average of confirmed cases.", purpose: "Denoises weekend testing reporting anomalies and provides smooth trendline." },
    { name: "Rolling_7_Std", type: "Continuous (Statistical)", desc: "7-day standard deviation measuring short-term case volatility.", purpose: "Signals outbreak phase transitions (accelerating surge vs plateau)." },
    { name: "Growth_Rate_Pct", type: "Percentage", desc: "Daily percentage rate of increase in total confirmed cases: ((C_t - C_{t-1}) / C_{t-1}) * 100.", purpose: "Captures instantaneous velocity and exponential compounding rate." },
    { name: "Day_of_Week", type: "Categorical (0-6)", desc: "Day index representing Monday (0) through Sunday (6).", purpose: "Enables model to learn laboratory testing and administrative batching schedules." }
  ],

  methodologyStages: [
    { num: "01", title: "Data Ingestion & Hygiene", desc: "Fetched official JHU CSSE global CSV repositories, verified integrity across 244 dates and 188 sovereign territories.", icon: "database" },
    { num: "02", title: "Exploratory Data Analysis", desc: "Visualized global progression curves, CFR distributions, cross-national Day-0 outbreak alignments, and log-log trajectories.", icon: "chart" },
    { num: "03", title: "Feature Engineering", desc: "Generated auto-regressive lag vectors (1, 7, 14 days), 7-day rolling statistics, growth rates, and temporal signals.", icon: "layers" },
    { num: "04", title: "Temporal Train/Test Splitting", desc: "Partitioned time-series chronologically (80% Train, 20% Out-of-Sample Test) to prevent forward-looking data leakage.", icon: "split" },
    { num: "05", title: "Multi-Model Architecture Training", desc: "Trained Linear Regression, Decision Tree, Random Forest, and Extreme Gradient Boosting (XGBoost) regressors.", icon: "cpu" },
    { num: "06", title: "Hyperparameter Optimization", desc: "Conducted RandomizedSearchCV over tree depth, learning rates, estimator counts, and subsample ratios.", icon: "sliders" },
    { num: "07", title: "30-Day Forward Forecasting", desc: "Generated recursive multi-step forecasts for India and comparator nations with confidence uncertainty bounds.", icon: "trending" },
    { num: "08", title: "Decision Intelligence & Policy", desc: "Translated forecast trajectories into actionable healthcare capacity estimations (ICU beds, oxygen, PPE) and containment guidance.", icon: "shield" }
  ],

  limitations: [
    { title: "Testing Capacity & Ascertainment Bias", desc: "Reported confirmed cases represent a fraction of true community infections, heavily conditioned on localized testing availability, reporting criteria changes, and administrative backlogs." },
    { title: "Non-Stationary Policy Shocks", desc: "Standard time-series regressors assume consistent dynamics; abrupt public health interventions (e.g. nation-wide lockdowns, mask mandates) introduce structural breaks not explicitly parameterized as exogenous inputs." },
    { title: "Extrapolation Beyond Training Domain", desc: "Unconstrained polynomial linear models risk explosive divergence over long forecast horizons; tree models cannot extrapolate values beyond the maximum observed in training data without trend decomposition." },
    { title: "Biological Compartmental Dynamics", desc: "Pure statistical regression does not inherently enforce biological transmission boundaries (such as susceptible pool depletion in SEIR models) without saturation dampening." }
  ]
};

// Export to window for vanilla JS accessibility
window.PROJECT_META = PROJECT_META;
