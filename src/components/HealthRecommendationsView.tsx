import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Hospital, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  ArrowRight
} from 'lucide-react';
import { CountryCovidData } from '../types/covid';
import { generateHealthRecommendations } from '../data/recommendations';

interface HealthRecommendationsViewProps {
  countryData: CountryCovidData;
}

export const HealthRecommendationsView: React.FC<HealthRecommendationsViewProps> = ({ countryData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const recommendations = useMemo(() => {
    return generateHealthRecommendations(countryData);
  }, [countryData]);

  const filteredRecs = useMemo(() => {
    return recommendations.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchSev = selectedSeverity === 'all' || r.severity === selectedSeverity;
      return matchCat && matchSev;
    });
  }, [recommendations, selectedCategory, selectedSeverity]);

  const categories = ['all', 'Hospital Capacity', 'Public Health Policy', 'Testing & Surveillance', 'Vaccination & Therapeutics', 'Logistics & Supply'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Data-Driven Policy & Healthcare Recommendations
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Actionable interventions synthesized from predictive machine learning forecasts for {countryData.country}
          </p>
        </div>

        {/* Export / Action Plan */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const content = recommendations.map(r => `[${r.severity.toUpperCase()}] ${r.category}: ${r.title}\nDescription: ${r.description}\nAction: ${r.recommendedAction}\nImpact: ${r.projectedImpact}\n`).join('\n---\n\n');
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `COVID19_Action_Plan_${countryData.code}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Action Plan</span>
          </button>
        </div>
      </div>

      {/* Priority Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-300 uppercase">Emergency Preparedness</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {countryData.totalActive > 100000 ? 'High Surge Risk' : 'Controlled Surveillance'}
            </div>
            <div className="text-[11px] text-slate-400">
              Active Load: {countryData.totalActive.toLocaleString()} infections
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-300 uppercase">Estimated ICU Requirement</div>
            <div className="text-sm font-bold text-white mt-0.5">
              ~{Math.round(countryData.totalActive * 0.012).toLocaleString()} Critical Beds
            </div>
            <div className="text-[11px] text-slate-400">1.2% intensive care admission rate</div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase">Reproduction Status</div>
            <div className="text-sm font-bold text-white mt-0.5">
              Rt = {countryData.history[countryData.history.length - 1]?.rtEstimate || 1.05}
            </div>
            <div className="text-[11px] text-slate-400">
              {countryData.history[countryData.history.length - 1]?.rtEstimate > 1 ? 'Outbreak Expanding' : 'Transmission Sub-Critical'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          {['all', 'critical', 'high', 'moderate', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                selectedSeverity === sev ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecs.map((rec) => {
          const sevColors = {
            critical: 'border-rose-500/40 bg-rose-500/5 text-rose-400',
            high: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
            moderate: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
            low: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
          };

          return (
            <div
              key={rec.id}
              className={`border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${sevColors[rec.severity]} bg-slate-900/90`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {rec.category}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    rec.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                    rec.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                    rec.severity === 'moderate' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {rec.severity} Priority
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">
                  {rec.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {rec.description}
                </p>

                {/* Target Metric */}
                <div className="mt-3 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                  <span className="font-semibold text-white">Target Metric: </span>
                  <span className="text-blue-300 font-mono">{rec.targetMetric}</span>
                </div>

                {/* Actionable Guideline */}
                <div className="mt-3 text-xs text-slate-200">
                  <div className="font-semibold text-slate-300 mb-1 flex items-center">
                    <ArrowRight className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    Recommended Action:
                  </div>
                  <p className="text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                    {rec.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Projected Impact */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Projected Epidemiological Impact:</span>
                <span className="text-emerald-400 font-medium">{rec.projectedImpact}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
