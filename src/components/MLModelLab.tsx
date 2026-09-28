import React, { useState, useMemo } from 'react';
import { 
  BrainCircuit, 
  Sliders, 
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area
} from 'recharts';
import { CountryCovidData, MLModelType, ModelHyperparameters, TrainedModelResult } from '../types/covid';
import { trainAndEvaluateModel } from '../ml/models';

interface MLModelLabProps {
  countryData: CountryCovidData;
}

export const MLModelLab: React.FC<MLModelLabProps> = ({ countryData }) => {
  const [selectedModel, setSelectedModel] = useState<MLModelType | 'compare_all'>('xgboost');
  const [activeSubTab, setActiveSubTab] = useState<'fit_curve' | 'feature_importance' | 'residuals' | 'comparison'>('fit_curve');

  // Hyperparameters State
  const [hyperparams, setHyperparams] = useState<ModelHyperparameters>({
    testSizeRatio: 0.2, // 80/20 train/test split
    lagDays: 7,
    useRollingFeatures: true,
    useDayOfWeek: true,
    maxDepth: 7,
    nEstimators: 100,
    learningRate: 0.05,
    minSamplesSplit: 4,
  });

  // Train selected model
  const singleModelResult: TrainedModelResult = useMemo(() => {
    const targetType = selectedModel === 'compare_all' ? 'xgboost' : selectedModel;
    return trainAndEvaluateModel(countryData.history, targetType, hyperparams);
  }, [countryData.history, selectedModel, hyperparams]);

  // Train all 4 models for side-by-side comparison leaderboard
  const allModelsComparison: TrainedModelResult[] = useMemo(() => {
    const models: MLModelType[] = ['linear_regression', 'decision_tree', 'random_forest', 'xgboost'];
    return models.map(m => trainAndEvaluateModel(countryData.history, m, hyperparams));
  }, [countryData.history, hyperparams]);

  // Combined visualization data for Train/Test Predictions
  const combinedPredictionData = useMemo(() => {
    const trainData = singleModelResult.trainPredictions.map(p => ({
      date: p.date,
      actualTrain: p.actual,
      predictedTrain: p.predicted,
      actualTest: undefined as number | undefined,
      predictedTest: undefined as number | undefined,
      lowerBound: undefined as number | undefined,
      upperBound: undefined as number | undefined,
    }));

    const testData = singleModelResult.testPredictions.map(p => ({
      date: p.date,
      actualTrain: undefined as number | undefined,
      predictedTrain: undefined as number | undefined,
      actualTest: p.actual,
      predictedTest: p.predicted,
      lowerBound: p.lowerBound,
      upperBound: p.upperBound,
    }));

    return [...trainData, ...testData];
  }, [singleModelResult]);

  return (
    <div className="space-y-6">
      {/* Header and Model Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Machine Learning Prediction & Model Lab
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluates Regression & Ensemble Gradient Boosted models on {countryData.country} outbreak time series
            </p>
          </div>

          {/* Model Selection Tabs */}
          <div className="flex flex-wrap bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 text-xs">
            <button
              onClick={() => { setSelectedModel('xgboost'); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedModel === 'xgboost' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              XGBoost Regressor
            </button>
            <button
              onClick={() => { setSelectedModel('random_forest'); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedModel === 'random_forest' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Random Forest
            </button>
            <button
              onClick={() => { setSelectedModel('decision_tree'); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedModel === 'decision_tree' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Decision Tree
            </button>
            <button
              onClick={() => { setSelectedModel('linear_regression'); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedModel === 'linear_regression' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Linear Regression
            </button>
            <button
              onClick={() => { setSelectedModel('compare_all'); setActiveSubTab('comparison'); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedModel === 'compare_all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leaderboard Compare
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Hyperparameters & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Hyperparameter Controls */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center">
              <Sliders className="w-4 h-4 text-blue-400 mr-2" />
              Hyperparameter Tuning
            </h2>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              Live Retraining
            </span>
          </div>

          {/* Test Size Split */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Test Set Ratio</span>
              <span className="text-blue-400 font-mono">{(hyperparams.testSizeRatio * 100).toFixed(0)}% Test</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={hyperparams.testSizeRatio}
              onChange={(e) => setHyperparams(prev => ({ ...prev, testSizeRatio: parseFloat(e.target.value) }))}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Lag Days Window */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Auto-Regressive Lag</span>
              <span className="text-blue-400 font-mono">{hyperparams.lagDays} Days</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 7, 14].map((lag) => (
                <button
                  key={lag}
                  onClick={() => setHyperparams(prev => ({ ...prev, lagDays: lag }))}
                  className={`py-1 rounded text-xs font-medium border transition-colors ${
                    hyperparams.lagDays === lag
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Lag-{lag}
                </button>
              ))}
            </div>
          </div>

          {/* Estimators (Trees) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">n_estimators</span>
              <span className="text-blue-400 font-mono">{hyperparams.nEstimators} trees</span>
            </div>
            <input
              type="range"
              min="20"
              max="250"
              step="10"
              value={hyperparams.nEstimators}
              onChange={(e) => setHyperparams(prev => ({ ...prev, nEstimators: parseInt(e.target.value) }))}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Max Depth */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">max_depth</span>
              <span className="text-blue-400 font-mono">{hyperparams.maxDepth}</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={hyperparams.maxDepth}
              onChange={(e) => setHyperparams(prev => ({ ...prev, maxDepth: parseInt(e.target.value) }))}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Learning Rate (Shrinkage) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">learning_rate (η)</span>
              <span className="text-blue-400 font-mono">{hyperparams.learningRate}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.25"
              step="0.01"
              value={hyperparams.learningRate}
              onChange={(e) => setHyperparams(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Feature Engineering Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Feature Engineering</span>
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hyperparams.useRollingFeatures}
                onChange={(e) => setHyperparams(prev => ({ ...prev, useRollingFeatures: e.target.checked }))}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>7-Day Rolling Mean & Std</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hyperparams.useDayOfWeek}
                onChange={(e) => setHyperparams(prev => ({ ...prev, useDayOfWeek: e.target.checked }))}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Cyclical Day of Week</span>
            </label>
          </div>
        </div>

        {/* Right Column: Model Metrics & Diagnostic Plots */}
        <div className="lg:col-span-3 space-y-4">
          {/* Evaluation Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* MAE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Mean Absolute Error (MAE)
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {singleModelResult.metrics.mae.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Average absolute case deviation</div>
            </div>

            {/* RMSE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Root Mean Sq Error (RMSE)
              </div>
              <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                {singleModelResult.metrics.rmse.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Penalizes large outlier errors</div>
            </div>

            {/* R2 Score */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                R² Determination Score
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {singleModelResult.metrics.r2.toFixed(4)}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                {singleModelResult.metrics.r2 > 0.9 ? '✓ High Variance Explained' : 'Modest Fit'}
              </div>
            </div>

            {/* MAPE / Latency */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                MAPE / Train Latency
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                {singleModelResult.metrics.mape}% <span className="text-xs text-slate-400 font-normal font-sans">({singleModelResult.metrics.trainTimeMs}ms)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Percentage accuracy error</div>
            </div>
          </div>

          {/* Model Sub-Tabs */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex space-x-2 text-xs">
                <button
                  onClick={() => setActiveSubTab('fit_curve')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeSubTab === 'fit_curve' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  Actual vs Predicted Fit
                </button>
                <button
                  onClick={() => setActiveSubTab('feature_importance')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeSubTab === 'feature_importance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  Feature Importance
                </button>
                <button
                  onClick={() => setActiveSubTab('residuals')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeSubTab === 'residuals' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  Residuals & Error Analysis
                </button>
                <button
                  onClick={() => setActiveSubTab('comparison')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeSubTab === 'comparison' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  4-Model Benchmark
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Model: <span className="text-white font-medium">{singleModelResult.name}</span>
              </div>
            </div>

            {/* Sub-tab 1: Actual vs Predicted Chart */}
            {activeSubTab === 'fit_curve' && (
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedPredictionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickFormatter={(val) => {
                        const parts = val.split('-');
                        return `${parts[1]}/${parts[2]}`;
                      }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                        return val;
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [typeof val === 'number' ? val.toLocaleString() : val, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

                    {/* Train Set */}
                    <Line type="monotone" dataKey="actualTrain" name="Train Actual" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="predictedTrain" name="Train Fit" stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" dot={false} />

                    {/* Test Set & Confidence Band */}
                    <Area type="monotone" dataKey="upperBound" name="95% CI Upper" stroke="transparent" fill="#3b82f6" fillOpacity={0.15} />
                    <Line type="monotone" dataKey="actualTest" name="Test Actual (Ground Truth)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="predictedTest" name="Test Model Prediction" stroke="#10b981" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sub-tab 2: Feature Importance Bar Chart */}
            {activeSubTab === 'feature_importance' && (
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={singleModelResult.featureImportance} layout="vertical" margin={{ top: 10, right: 20, left: 70, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}% Relative Gain`, 'Importance']}
                    />
                    <Bar dataKey="importance" name="Relative Feature Importance" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sub-tab 3: Residuals & Error Analysis */}
            {activeSubTab === 'residuals' && (
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={singleModelResult.residuals} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis 
                      dataKey="actual" 
                      name="Actual Cases" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                        return val;
                      }}
                    />
                    <YAxis dataKey="error" name="Residual (Actual - Predicted)" stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [typeof val === 'number' ? val.toLocaleString() : val, name]}
                    />
                    <Bar dataKey="error" name="Residual Error" fill="#f59e0b" opacity={0.7} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sub-tab 4: 4-Model Benchmark Comparison Table */}
            {activeSubTab === 'comparison' && (
              <div className="pt-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">Model Architecture</th>
                      <th className="py-2.5 px-3">MAE (Cases)</th>
                      <th className="py-2.5 px-3">RMSE (Cases)</th>
                      <th className="py-2.5 px-3">R² Score</th>
                      <th className="py-2.5 px-3">MAPE %</th>
                      <th className="py-2.5 px-3">Train Latency</th>
                      <th className="py-2.5 px-3 rounded-r-lg">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[...allModelsComparison]
                      .sort((a, b) => b.metrics.r2 - a.metrics.r2)
                      .map((res, index) => {
                        const isBest = index === 0;
                        return (
                          <tr key={res.modelType} className={`hover:bg-slate-800/50 ${isBest ? 'bg-blue-600/10' : ''}`}>
                            <td className="py-3 px-3 font-semibold text-white flex items-center space-x-2">
                              {isBest && <Sparkles className="w-4 h-4 text-amber-400" />}
                              <span>{res.name}</span>
                            </td>
                            <td className="py-3 px-3 font-mono">{res.metrics.mae.toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono text-blue-400">{res.metrics.rmse.toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                res.metrics.r2 > 0.95 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {res.metrics.r2.toFixed(4)}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-amber-400">{res.metrics.mape}%</td>
                            <td className="py-3 px-3 text-slate-400">{res.metrics.trainTimeMs}ms</td>
                            <td className="py-3 px-3 font-bold">
                              {isBest ? <span className="text-amber-400">#1 Best</span> : `#${index + 1}`}
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
