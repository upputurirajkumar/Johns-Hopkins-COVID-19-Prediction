import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Compass, 
  Globe, 
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ZAxis
} from 'recharts';
import { COUNTRIES_DATA } from '../data/covidData';
import { CountryCovidData } from '../types/covid';

interface EDAVisualsProps {
  currentCountry: CountryCovidData;
}

export const EDAVisuals: React.FC<EDAVisualsProps> = ({ currentCountry }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<'trajectory' | 'aligned_day0' | 'cfr_scatter' | 'correlation'>('trajectory');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['USA', 'IND', 'BRA', 'RUS', 'GBR', 'ITA']);

  // Trajectory data: Total Confirmed (X) vs New Confirmed in past week (Y) on Log Scale
  const trajectoryData = useMemo(() => {
    return currentCountry.history
      .filter(p => p.confirmed > 100)
      .map(p => ({
        date: p.date,
        totalCases: p.confirmed,
        weeklyNewCases: p.rolling7Confirmed * 7 || 1,
      }));
  }, [currentCountry]);

  // Aligned Day 0 Outbreak (where Day 0 is when country crossed 1,000 confirmed cases)
  const alignedDay0Data = useMemo(() => {
    const countryHistories = COUNTRIES_DATA.filter(c => selectedCountries.includes(c.code));
    const alignedRows: Record<number, any> = {};

    countryHistories.forEach(c => {
      const filtered = c.history.filter(p => p.confirmed >= 1000);
      filtered.forEach((p, dayIdx) => {
        if (!alignedRows[dayIdx]) {
          alignedRows[dayIdx] = { daySince1000: dayIdx };
        }
        alignedRows[dayIdx][c.code] = p.confirmed;
      });
    });

    return Object.values(alignedRows).slice(0, 180); // First 180 days
  }, [selectedCountries]);

  // CFR vs Recovery Rate scatter plot data
  const scatterData = useMemo(() => {
    return COUNTRIES_DATA.filter(c => c.code !== 'GLOBAL').map(c => ({
      country: c.country,
      code: c.code,
      cfr: c.cfr,
      recoveryRate: c.recoveryRate,
      confirmed: c.totalConfirmed,
      doublingDays: c.doublingTimeDays,
    }));
  }, []);

  // Correlation Matrix Data
  const correlationFeatures = [
    { name: 'Lag-1 Cases', daysOutbreak: 0.98, lag7: 0.99, rollingMean: 0.99, growthRate: -0.42, target: 0.99 },
    { name: 'Lag-7 Cases', daysOutbreak: 0.96, lag7: 1.00, rollingMean: 0.98, growthRate: -0.38, target: 0.97 },
    { name: 'Rolling Mean', daysOutbreak: 0.97, lag7: 0.98, rollingMean: 1.00, growthRate: -0.35, target: 0.98 },
    { name: 'Days Outbreak', daysOutbreak: 1.00, lag7: 0.96, rollingMean: 0.97, growthRate: -0.61, target: 0.96 },
    { name: 'Growth Rate', daysOutbreak: -0.61, lag7: -0.38, rollingMean: -0.35, growthRate: 1.00, target: -0.32 },
  ];

  const countryColors: Record<string, string> = {
    USA: '#3b82f6',
    IND: '#f59e0b',
    BRA: '#10b981',
    RUS: '#a855f7',
    GBR: '#ec4899',
    ITA: '#06b6d4',
    ESP: '#f43f5e',
    FRA: '#8b5cf6',
    DEU: '#14b8a6',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Exploratory Data Analysis (EDA) & Comparative Diagnostics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 5 data science diagnostics, trajectory curves, and cross-national epidemic alignments
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveAnalysis('trajectory')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeAnalysis === 'trajectory' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Trajectory Curve
          </button>
          <button
            onClick={() => setActiveAnalysis('aligned_day0')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeAnalysis === 'aligned_day0' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Day 0 Outbreak
          </button>
          <button
            onClick={() => setActiveAnalysis('cfr_scatter')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeAnalysis === 'cfr_scatter' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            CFR vs Recovery
          </button>
          <button
            onClick={() => setActiveAnalysis('correlation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeAnalysis === 'correlation' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Correlation Matrix
          </button>
        </div>
      </div>

      {/* Analysis 1: Log-Log Trajectory Curve */}
      {activeAnalysis === 'trajectory' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
                Epidemic Trajectory Curve for {currentCountry.country} (Log-Log)
              </h3>
              <p className="text-xs text-slate-400">
                Weekly New Cases vs Total Cumulative Cases. Dropping off the diagonal line indicates outbreak containment.
              </p>
            </div>
            <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              Logarithmic Space (log₁₀)
            </span>
          </div>

          <div className="h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trajectoryData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="totalCases" 
                  name="Total Cumulative Cases"
                  type="number"
                  scale="log"
                  domain={['auto', 'auto']}
                  stroke="#64748b" 
                  fontSize={11}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <YAxis 
                  dataKey="weeklyNewCases" 
                  name="Weekly New Cases"
                  type="number"
                  scale="log"
                  domain={['auto', 'auto']}
                  stroke="#64748b" 
                  fontSize={11}
                  tickFormatter={(val) => {
                    if (val >= 100000) return `${(val / 1000).toFixed(0)}k`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [typeof val === 'number' ? val.toLocaleString() : val, name]}
                />
                <Line type="monotone" dataKey="weeklyNewCases" name="Trajectory Path" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Analysis 2: Aligned Day 0 Outbreak Comparison */}
      {activeAnalysis === 'aligned_day0' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <Globe className="w-4 h-4 text-emerald-400 mr-2" />
                Cross-National Outbreak Alignment (Days Since 1,000 Cases)
              </h3>
              <p className="text-xs text-slate-400">
                Normalizes timeline disparities by anchoring Day 0 when each country surpassed 1,000 confirmed cases
              </p>
            </div>

            {/* Country Selector Filter */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['USA', 'IND', 'BRA', 'RUS', 'GBR', 'ITA', 'FRA', 'ESP', 'DEU'].map((code) => {
                const active = selectedCountries.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => {
                      setSelectedCountries(prev => 
                        prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
                      );
                    }}
                    className={`px-2.5 py-1 rounded font-medium border transition-colors ${
                      active ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={alignedDay0Data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="daySince1000" name="Days Since 1,000 Cases" stroke="#64748b" fontSize={11} />
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

                {selectedCountries.map((code) => (
                  <Line 
                    key={code}
                    type="monotone" 
                    dataKey={code} 
                    name={code}
                    stroke={countryColors[code] || '#94a3b8'} 
                    strokeWidth={2.5} 
                    dot={false} 
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Analysis 3: CFR vs Recovery Rate Scatter */}
      {activeAnalysis === 'cfr_scatter' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <Activity className="w-4 h-4 text-rose-400 mr-2" />
                Case Fatality Rate (CFR %) vs Clinical Recovery Rate (%)
              </h3>
              <p className="text-xs text-slate-400">
                Bubble radius represents total confirmed case scale across nations
              </p>
            </div>
          </div>

          <div className="h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="recoveryRate" 
                  name="Recovery Rate (%)" 
                  unit="%" 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={[0, 100]}
                />
                <YAxis 
                  dataKey="cfr" 
                  name="Case Fatality Rate (%)" 
                  unit="%" 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={[0, 15]}
                />
                <ZAxis dataKey="confirmed" range={[60, 600]} name="Cases" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [name === 'Cases' ? val.toLocaleString() : `${val}%`, name]}
                />
                <Scatter name="Countries" data={scatterData} fill="#3b82f6" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Analysis 4: Feature Correlation Matrix */}
      {activeAnalysis === 'correlation' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center">
              <Compass className="w-4 h-4 text-indigo-400 mr-2" />
              Machine Learning Feature Correlation Matrix (Pearson r)
            </h3>
            <p className="text-xs text-slate-400">
              Quantifies multi-collinearity and predictive signal correlation with target cumulative confirmed cases
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-left rounded-l-lg">Feature Name</th>
                  <th className="py-3 px-4">Days Outbreak</th>
                  <th className="py-3 px-4">Lag-7</th>
                  <th className="py-3 px-4">Rolling Mean</th>
                  <th className="py-3 px-4">Growth Rate</th>
                  <th className="py-3 px-4 rounded-r-lg font-bold text-blue-400">Target (Confirmed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {correlationFeatures.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans text-left font-semibold text-white">{row.name}</td>
                    <td className={`py-3 px-4 ${row.daysOutbreak > 0 ? 'text-blue-300' : 'text-rose-300'}`}>{row.daysOutbreak.toFixed(2)}</td>
                    <td className={`py-3 px-4 ${row.lag7 > 0 ? 'text-blue-300' : 'text-rose-300'}`}>{row.lag7.toFixed(2)}</td>
                    <td className={`py-3 px-4 ${row.rollingMean > 0 ? 'text-blue-300' : 'text-rose-300'}`}>{row.rollingMean.toFixed(2)}</td>
                    <td className={`py-3 px-4 ${row.growthRate > 0 ? 'text-blue-300' : 'text-rose-300'}`}>{row.growthRate.toFixed(2)}</td>
                    <td className={`py-3 px-4 font-bold ${row.target > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {row.target.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
