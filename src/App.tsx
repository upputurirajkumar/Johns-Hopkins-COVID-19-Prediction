import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { MLModelLab } from './components/MLModelLab';
import { ForecastingSimulator } from './components/ForecastingSimulator';
import { HealthRecommendationsView } from './components/HealthRecommendationsView';
import { EDAVisuals } from './components/EDAVisuals';
import { DataExplorer } from './components/DataExplorer';
import { COUNTRIES_DATA } from './data/covidData';
import { CountryCovidData } from './types/covid';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedCountry, setSelectedCountry] = useState<CountryCovidData>(COUNTRIES_DATA[0]); // Global Total default

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewDashboard
            countryData={selectedCountry}
            onSelectCountry={(c) => setSelectedCountry(c)}
          />
        )}

        {activeTab === 'ml_models' && (
          <MLModelLab countryData={selectedCountry} />
        )}

        {activeTab === 'forecasting' && (
          <ForecastingSimulator countryData={selectedCountry} />
        )}

        {activeTab === 'recommendations' && (
          <HealthRecommendationsView countryData={selectedCountry} />
        )}

        {activeTab === 'eda' && (
          <EDAVisuals currentCountry={selectedCountry} />
        )}

        {activeTab === 'explorer' && (
          <DataExplorer countryData={selectedCountry} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-300">PRCP-1023 : Johns Hopkins COVID-19 Prediction</span>
            <span className="text-slate-500 ml-2">Center for Systems Science and Engineering (JHU CSSE)</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Machine Learning Forecasting</span>
            <span>•</span>
            <span>Healthcare Resource Planning</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
