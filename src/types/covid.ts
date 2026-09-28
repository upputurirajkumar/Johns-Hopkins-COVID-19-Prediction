export interface DailyCovidRecord {
  date: string; // YYYY-MM-DD
  dayIndex: number;
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
  dailyConfirmed: number;
  dailyDeaths: number;
  dailyRecovered: number;
  rolling7Confirmed: number;
  rolling7Deaths: number;
  cfr: number; // Case Fatality Rate %
  recoveryRate: number; // Recovery Rate %
  growthRatePct: number; // Daily growth %
  rtEstimate: number; // Reproduction number estimation
}

export interface CountryCovidData {
  country: string;
  code: string;
  lat: number;
  long: number;
  population: number;
  totalConfirmed: number;
  totalDeaths: number;
  totalRecovered: number;
  totalActive: number;
  cfr: number;
  recoveryRate: number;
  doublingTimeDays: number;
  peakDailyCases: number;
  peakDate: string;
  history: DailyCovidRecord[];
}

export type MLModelType = 'linear_regression' | 'decision_tree' | 'random_forest' | 'xgboost';

export interface ModelHyperparameters {
  // Common
  testSizeRatio: number; // e.g. 0.2 (80/20)
  lagDays: number; // 1, 7, 14, 30
  useRollingFeatures: boolean;
  useDayOfWeek: boolean;

  // Linear Regression
  polynomialDegree?: number;
  fitIntercept?: boolean;

  // Tree / Forest / XGBoost
  maxDepth?: number;
  nEstimators?: number;
  minSamplesSplit?: number;
  learningRate?: number;
  subsampleRatio?: number;
  colsampleByTree?: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  trainTimeMs: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number; // 0 to 1
  description: string;
}

export interface PredictionPoint {
  date: string;
  dayIndex: number;
  actual?: number;
  predicted: number;
  residual?: number;
  lowerBound?: number;
  upperBound?: number;
  isTestSet?: boolean;
}

export interface TrainedModelResult {
  modelType: MLModelType;
  name: string;
  description: string;
  metrics: ModelMetrics;
  testPredictions: PredictionPoint[];
  trainPredictions: PredictionPoint[];
  featureImportance: FeatureImportanceItem[];
  hyperparameters: ModelHyperparameters;
  residuals: { actual: number; predicted: number; error: number }[];
}

export interface FutureForecastPoint {
  date: string;
  dayIndex: number;
  forecastConfirmed: number;
  forecastDailyNew: number;
  lowerBound: number;
  upperBound: number;
  baselineForecast: number;
  scenarioForecast: number;
  icuBedsRequired: number;
  hospitalBedsRequired: number;
  ventilatorsRequired: number;
  oxygenTonsRequired: number;
}

export interface SimulationScenarioConfig {
  lockdownStrictness: number; // 0 (none) to 100 (complete lockdown)
  maskCompliance: number; // 0 to 100%
  vaccinationRateDailyPct: number; // e.g. 0.5% per day
  variantTransmissibilityModifier: number; // e.g. 1.0 = baseline, 1.5 = +50% faster
  testingTracingEfficiency: number; // 0 to 100%
}

export interface HealthRecommendation {
  id: string;
  category: 'Hospital Capacity' | 'Public Health Policy' | 'Testing & Surveillance' | 'Vaccination & Therapeutics' | 'Logistics & Supply';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  targetMetric: string;
  recommendedAction: string;
  projectedImpact: string;
}
