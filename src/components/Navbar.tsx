import React from 'react';
import { Activity, BrainCircuit, TrendingUp, ShieldAlert, BarChart3, Database, Globe } from 'lucide-react';
import { COUNTRIES_DATA } from '../data/covidData';
import { CountryCovidData } from '../types/covid';

export type ActiveTab = 'overview' | 'ml_models' | 'forecasting' | 'recommendations' | 'eda' | 'explorer';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCountry: CountryCovidData;
  setSelectedCountry: (country: CountryCovidData) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCountry,
  setSelectedCountry,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Epidemic Dashboard', icon: <Activity className="w-4 h-4" /> },
    { id: 'ml_models', label: 'ML Prediction Lab', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'forecasting', label: 'Scenario Forecasting', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Policy & Healthcare', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'eda', label: 'EDA & Visualizations', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'explorer', label: 'Dataset Explorer', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Johns Hopkins COVID-19</span>
                <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ML Forecasting
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">PRCP-1023 Predictive Analytics Suite</p>
            </div>
          </div>

          {/* Country Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-inner">
              <Globe className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
              <select
                value={selectedCountry.country}
                onChange={(e) => {
                  const found = COUNTRIES_DATA.find(c => c.country === e.target.value);
                  if (found) setSelectedCountry(found);
                }}
                className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                {COUNTRIES_DATA.map((c) => (
                  <option key={c.code} value={c.country} className="bg-slate-900 text-slate-100">
                    {c.country} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
