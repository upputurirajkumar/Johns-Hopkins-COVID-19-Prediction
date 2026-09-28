import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Skull, 
  HeartPulse, 
  Activity, 
  Flame, 
  TrendingUp, 
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { CountryCovidData, DailyCovidRecord } from '../types/covid';
import { COUNTRIES_DATA } from '../data/covidData';

interface OverviewDashboardProps {
  countryData: CountryCovidData;
  onSelectCountry: (country: CountryCovidData) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  countryData,
  onSelectCountry,
}) => {
  const [metricView, setMetricView] = useState<'cumulative' | 'daily' | 'rolling' | 'deaths_rec'>('rolling');
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const [timeRange, setTimeRange] = useState<'all' | '90' | '30'>('all');

  // Filter history according to time range
  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') return countryData.history;
    const days = timeRange === '90' ? 90 : 30;
    return countryData.history.slice(Math.max(0, countryData.history.length - days));
  }, [countryData.history, timeRange]);

  const latestRecord = countryData.history[countryData.history.length - 1] || {} as DailyCovidRecord;
  const prevDayRecord = countryData.history[countryData.history.length - 2] || {} as DailyCovidRecord;

  const dailyChangePct = prevDayRecord.dailyConfirmed > 0
    ? ((latestRecord.dailyConfirmed - prevDayRecord.dailyConfirmed) / prevDayRecord.dailyConfirmed) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Country Header & Key Status */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{countryData.country}</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              ISO: {countryData.code}
            </span>
            {countryData.code !== 'GLOBAL' && (
              <span className="text-xs text-slate-400">
                Population: {countryData.population.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data Source: Johns Hopkins University CSSE Time-Series (Jan 22, 2020 – Sep 21, 2020)
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2">
            <TrendingUp className="w-4 h-4 text-amber-400 mr-2" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Effective Reproduction (Rt)</div>
              <div className="text-sm font-bold text-amber-400">{latestRecord.rtEstimate || 1.05}</div>
            </div>
          </div>

          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2">
            <Activity className="w-4 h-4 text-emerald-400 mr-2" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Doubling Period</div>
              <div className="text-sm font-bold text-emerald-400">~{countryData.doublingTimeDays} Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Confirmed */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Confirmed</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {countryData.totalConfirmed.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-blue-400 font-medium mr-1.5">
              +{latestRecord.dailyConfirmed?.toLocaleString()}
            </span>
            <span>new daily cases</span>
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Infections</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
            {countryData.totalActive.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span>{((countryData.totalActive / countryData.totalConfirmed) * 100).toFixed(1)}% of all cases active</span>
          </div>
        </div>

        {/* Total Recovered */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Recoveries</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">
            {countryData.totalRecovered.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-emerald-400 font-medium mr-1.5">{countryData.recoveryRate}%</span>
            <span>clinical recovery rate</span>
          </div>
        </div>

        {/* Total Deaths / CFR */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Deceased</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <Skull className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">
            {countryData.totalDeaths.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-rose-400 font-medium mr-1.5">{countryData.cfr}%</span>
            <span>Case Fatality Rate (CFR)</span>
          </div>
        </div>
      </div>

      {/* Main Epidemiological Chart Area */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              Epidemic Trajectory & Progression
            </h2>
            <p className="text-xs text-slate-400">
              Interactive multi-series visualization with 7-day smoothing filter
            </p>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setMetricView('rolling')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  metricView === 'rolling' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                7-Day Moving Avg
              </button>
              <button
                onClick={() => setMetricView('daily')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  metricView === 'daily' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily Cases
              </button>
              <button
                onClick={() => setMetricView('cumulative')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  metricView === 'cumulative' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cumulative
              </button>
              <button
                onClick={() => setMetricView('deaths_rec')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  metricView === 'deaths_rec' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Deaths & Recoveries
              </button>
            </div>

            {/* Timeframe */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              {(['all', '90', '30'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1.5 rounded-md font-medium uppercase transition-colors ${
                    timeRange === range ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range === 'all' ? 'All' : `${range}d`}
                </button>
              ))}
            </div>

            {/* Scale toggle */}
            <button
              onClick={() => setScaleType(prev => prev === 'linear' ? 'log' : 'linear')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                scaleType === 'log'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {scaleType === 'log' ? 'Log Scale (log₁₀)' : 'Linear Scale'}
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-80 sm:h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDeaths" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
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
                scale={scaleType === 'log' ? 'log' : 'auto'}
                domain={scaleType === 'log' ? [1, 'auto'] : [0, 'auto']}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
                formatter={(value: any, name: any) => [
                  typeof value === 'number' ? value.toLocaleString() : value, 
                  name
                ]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

              {metricView === 'cumulative' && (
                <>
                  <Area type="monotone" dataKey="confirmed" name="Cumulative Confirmed" stroke="#3b82f6" fill="url(#colorConfirmed)" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="recovered" name="Cumulative Recovered" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="deaths" name="Cumulative Deaths" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </>
              )}

              {metricView === 'daily' && (
                <>
                  <Bar dataKey="dailyConfirmed" name="Daily Confirmed Cases" fill="#3b82f6" opacity={0.65} radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="rolling7Confirmed" name="7-Day Moving Avg" stroke="#f59e0b" strokeWidth={3} dot={false} />
                </>
              )}

              {metricView === 'rolling' && (
                <>
                  <Bar dataKey="dailyConfirmed" name="Daily New Cases" fill="#38bdf8" opacity={0.35} radius={[2, 2, 0, 0]} />
                  <Area type="monotone" dataKey="rolling7Confirmed" name="7-Day Moving Avg" stroke="#3b82f6" fill="url(#colorConfirmed)" strokeWidth={3} />
                  <Line type="monotone" dataKey="rolling7Deaths" name="7-Day Deaths Avg" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </>
              )}

              {metricView === 'deaths_rec' && (
                <>
                  <Area type="monotone" dataKey="recovered" name="Recoveries" stroke="#10b981" fill="url(#colorRecovered)" strokeWidth={2} />
                  <Area type="monotone" dataKey="deaths" name="Deaths" stroke="#f43f5e" fill="url(#colorDeaths)" strokeWidth={2} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global & Country Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Countries Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <Globe className="w-4 h-4 text-blue-400 mr-2" />
                Top Countries by Confirmed Cases
              </h3>
              <p className="text-xs text-slate-400">Click on any country row to drill-down and load forecasting models</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              JHU Dataset
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Country</th>
                  <th className="py-2.5 px-3">Total Cases</th>
                  <th className="py-2.5 px-3">Deaths</th>
                  <th className="py-2.5 px-3">CFR %</th>
                  <th className="py-2.5 px-3">Recovery %</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {COUNTRIES_DATA.filter(c => c.code !== 'GLOBAL').slice(0, 10).map((c, index) => {
                  const isSelected = countryData.code === c.code;
                  return (
                    <tr
                      key={c.code}
                      onClick={() => onSelectCountry(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 text-white font-medium'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 flex items-center space-x-2">
                        <span className="text-slate-500 font-mono w-4">{index + 1}.</span>
                        <span className="font-semibold text-white">{c.country}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{c.totalConfirmed.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-rose-400">{c.totalDeaths.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          c.cfr > 5 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {c.cfr}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400">{c.recoveryRate}%</td>
                      <td className="py-3 px-3 text-right">
                        <button className="p-1 rounded-md bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outbreak Metrics & Diagnostic Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" />
              Epidemiological Profile
            </h3>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400">Peak Daily Outbreak</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {countryData.peakDailyCases.toLocaleString()} cases
                </div>
                <div className="text-[11px] text-slate-400">Recorded on {countryData.peakDate}</div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400">Estimated Case Doubling Time</div>
                <div className="text-lg font-bold text-blue-400 mt-0.5">
                  {countryData.doublingTimeDays} Days
                </div>
                <div className="text-[11px] text-slate-400">Based on cumulative exponential inflection</div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400">Healthcare System Active Load</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {countryData.code !== 'GLOBAL' 
                    ? `${Math.round((countryData.totalActive / countryData.population) * 100000)} per 100k`
                    : `${countryData.totalActive.toLocaleString()} active`}
                </div>
                <div className="text-[11px] text-slate-400">Population prevalence density</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Machine Learning Ready</span>
            <span className="text-emerald-400 font-medium">✓ 248 Time-Series Steps</span>
          </div>
        </div>
      </div>
    </div>
  );
};
