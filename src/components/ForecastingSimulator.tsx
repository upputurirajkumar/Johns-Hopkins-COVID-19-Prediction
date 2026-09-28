import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Sliders, 
  BedDouble, 
  Wind, 
  Syringe, 
  AlertCircle, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { CountryCovidData, SimulationScenarioConfig, FutureForecastPoint } from '../types/covid';
import { generateFutureForecast } from '../ml/models';

interface ForecastingSimulatorProps {
  countryData: CountryCovidData;
}

export const ForecastingSimulator: React.FC<ForecastingSimulatorProps> = ({ countryData }) => {
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [scenario, setScenario] = useState<SimulationScenarioConfig>({
    lockdownStrictness: 30,
    maskCompliance: 50,
    vaccinationRateDailyPct: 0.3,
    variantTransmissibilityModifier: 1.0,
    testingTracingEfficiency: 60,
  });

  // Generate Future Forecast Points
  const forecastPoints = useMemo(() => {
    return generateFutureForecast(countryData.history, horizonDays, scenario, countryData.population);
  }, [countryData.history, horizonDays, scenario, countryData.population]);

  // Combine last 45 days of historical data + forecast points for seamless continuity
  const chartData = useMemo(() => {
    const recentHistory = countryData.history.slice(Math.max(0, countryData.history.length - 45));
    const histPoints = recentHistory.map(p => ({
      date: p.date,
      historicalConfirmed: p.confirmed,
      forecastScenario: undefined as number | undefined,
      forecastBaseline: undefined as number | undefined,
      lowerCI: undefined as number | undefined,
      upperCI: undefined as number | undefined,
      isForecast: false,
    }));

    // Anchor bridge point
    const lastHist = recentHistory[recentHistory.length - 1];

    const futurePoints = forecastPoints.map(p => ({
      date: p.date,
      historicalConfirmed: undefined as number | undefined,
      forecastScenario: p.scenarioForecast,
      forecastBaseline: p.baselineForecast,
      lowerCI: p.lowerBound,
      upperCI: p.upperBound,
      isForecast: true,
    }));

    // Ensure connection point
    if (lastHist) {
      histPoints[histPoints.length - 1].forecastScenario = lastHist.confirmed;
      histPoints[histPoints.length - 1].forecastBaseline = lastHist.confirmed;
      histPoints[histPoints.length - 1].lowerCI = lastHist.confirmed;
      histPoints[histPoints.length - 1].upperCI = lastHist.confirmed;
    }

    return [...histPoints, ...futurePoints];
  }, [countryData.history, forecastPoints]);

  // Healthcare Burden Summary at end of horizon
  const finalDayForecast = forecastPoints[forecastPoints.length - 1] || {} as FutureForecastPoint;
  const finalBaseline = finalDayForecast.baselineForecast || 1;
  const finalScenario = finalDayForecast.scenarioForecast || 1;
  const casesAverted = Math.max(0, finalBaseline - finalScenario);
  const reductionPct = ((casesAverted / finalBaseline) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Multi-Horizon Future Forecasting & Policy Sandbox
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulate epidemiological trajectory for {countryData.country} under variable intervention scenarios
            </p>
          </div>

          {/* Horizon Selection */}
          <div className="flex bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 text-xs">
            {[7, 14, 30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  horizonDays === days ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                +{days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Sandbox Controls vs Forecast Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Intervention Simulation Sliders */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center">
              <Sliders className="w-4 h-4 text-blue-400 mr-2" />
              Scenario Controls
            </h2>
            <button
              onClick={() => setScenario({
                lockdownStrictness: 0,
                maskCompliance: 0,
                vaccinationRateDailyPct: 0,
                variantTransmissibilityModifier: 1.0,
                testingTracingEfficiency: 20,
              })}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>

          {/* Containment / Mobility */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Containment Strictness</span>
              <span className="text-blue-400 font-mono">{scenario.lockdownStrictness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={scenario.lockdownStrictness}
              onChange={(e) => setScenario(prev => ({ ...prev, lockdownStrictness: parseInt(e.target.value) }))}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Mask Compliance */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Mask Compliance</span>
              <span className="text-emerald-400 font-mono">{scenario.maskCompliance}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={scenario.maskCompliance}
              onChange={(e) => setScenario(prev => ({ ...prev, maskCompliance: parseInt(e.target.value) }))}
              className="w-full accent-emerald-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Vaccination Rollout */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Daily Vaccine Rollout</span>
              <span className="text-indigo-400 font-mono">{scenario.vaccinationRateDailyPct}% / day</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={scenario.vaccinationRateDailyPct}
              onChange={(e) => setScenario(prev => ({ ...prev, vaccinationRateDailyPct: parseFloat(e.target.value) }))}
              className="w-full accent-indigo-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Testing & Tracing */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Testing & Tracing Power</span>
              <span className="text-amber-400 font-mono">{scenario.testingTracingEfficiency}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={scenario.testingTracingEfficiency}
              onChange={(e) => setScenario(prev => ({ ...prev, testingTracingEfficiency: parseInt(e.target.value) }))}
              className="w-full accent-amber-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Variant Transmissibility Modifier */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Variant Transmissibility</span>
              <span className="text-rose-400 font-mono">{scenario.variantTransmissibilityModifier}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={scenario.variantTransmissibilityModifier}
              onChange={(e) => setScenario(prev => ({ ...prev, variantTransmissibilityModifier: parseFloat(e.target.value) }))}
              className="w-full accent-rose-500 bg-slate-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Scenario Presets */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Quick Policy Presets</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setScenario({
                  lockdownStrictness: 75,
                  maskCompliance: 85,
                  vaccinationRateDailyPct: 0.8,
                  variantTransmissibilityModifier: 1.0,
                  testingTracingEfficiency: 90,
                })}
                className="py-1 px-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs text-left"
              >
                🔒 Strict Lock
              </button>
              <button
                onClick={() => setScenario({
                  lockdownStrictness: 10,
                  maskCompliance: 30,
                  vaccinationRateDailyPct: 0.1,
                  variantTransmissibilityModifier: 1.4,
                  testingTracingEfficiency: 40,
                })}
                className="py-1 px-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs text-left"
              >
                ⚡ Variant Wave
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Forecast Visualizer & Resource Impacts */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Forecast Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
                  Projected Outbreak Trajectory (Horizon: +{horizonDays} Days)
                </h3>
                <p className="text-xs text-slate-400">
                  Compares unmitigated baseline projection vs policy-constrained intervention scenario
                </p>
              </div>

              {/* Case Averted Badge */}
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-medium">
                  {casesAverted > 0 ? `~${casesAverted.toLocaleString()} cases averted (-${reductionPct}%)` : 'Baseline Scenario'}
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
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

                  {/* Historical */}
                  <Line type="monotone" dataKey="historicalConfirmed" name="Historical Observed" stroke="#38bdf8" strokeWidth={2.5} dot={false} />

                  {/* Baseline Unmitigated */}
                  <Line type="monotone" dataKey="forecastBaseline" name="Unmitigated Baseline" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={false} />

                  {/* Uncertainty Band */}
                  <Area type="monotone" dataKey="upperCI" name="95% CI Bound" stroke="transparent" fill="#10b981" fillOpacity={0.12} />

                  {/* Scenario Curve */}
                  <Area type="monotone" dataKey="forecastScenario" name="Scenario Projection" stroke="#10b981" fill="url(#colorForecast)" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Healthcare Burden Projection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* General Hospital Beds */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="flex items-center text-slate-400 text-xs">
                <BedDouble className="w-4 h-4 text-blue-400 mr-1.5" />
                <span>Hospital Beds</span>
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {finalDayForecast.hospitalBedsRequired?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Estimated inpatient ward load</div>
            </div>

            {/* ICU Beds */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="flex items-center text-slate-400 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 mr-1.5" />
                <span>ICU Beds</span>
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                {finalDayForecast.icuBedsRequired?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Critical intensive care demand</div>
            </div>

            {/* Ventilators */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="flex items-center text-slate-400 text-xs">
                <Wind className="w-4 h-4 text-rose-400 mr-1.5" />
                <span>Ventilators</span>
              </div>
              <div className="text-xl font-bold text-rose-400 font-mono mt-1">
                {finalDayForecast.ventilatorsRequired?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Mechanical ventilation demand</div>
            </div>

            {/* Oxygen Supply */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-md">
              <div className="flex items-center text-slate-400 text-xs">
                <Syringe className="w-4 h-4 text-emerald-400 mr-1.5" />
                <span>Medical Oxygen</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {finalDayForecast.oxygenTonsRequired} T/day
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Liquid medical oxygen demand</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
