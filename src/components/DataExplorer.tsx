import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  FileSpreadsheet, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CountryCovidData, DailyCovidRecord } from '../types/covid';

interface DataExplorerProps {
  countryData: CountryCovidData;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ countryData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof DailyCovidRecord>('dayIndex');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filtered and Sorted Records
  const processedRecords = useMemo(() => {
    let list = [...countryData.history];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(r => 
        r.date.toLowerCase().includes(term) ||
        r.confirmed.toString().includes(term) ||
        r.dailyConfirmed.toString().includes(term)
      );
    }

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });

    return list;
  }, [countryData.history, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;
  const currentRecords = processedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Toggle sort handler
  const handleSort = (field: keyof DailyCovidRecord) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'DayIndex', 'Confirmed', 'DailyNew', 'Rolling7Avg', 'Deaths', 'DailyDeaths', 'Recovered', 'Active', 'CFR_Pct', 'GrowthRate_Pct', 'Rt_Estimate'];
    const rows = countryData.history.map(r => [
      r.date,
      r.dayIndex,
      r.confirmed,
      r.dailyConfirmed,
      r.rolling7Confirmed,
      r.deaths,
      r.dailyDeaths,
      r.recovered,
      r.active,
      r.cfr,
      r.growthRatePct,
      r.rtEstimate,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `COVID19_JHU_${countryData.code}_TimeSeries.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(countryData.history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `COVID19_JHU_${countryData.code}_TimeSeries.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Raw & Processed Time-Series Dataset Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {countryData.history.length} time-series daily observations for {countryData.country}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, processedRecords.length)} of {processedRecords.length} records
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/90 text-slate-300 font-sans font-semibold uppercase tracking-wider">
              <tr>
                <th onClick={() => handleSort('date')} className="py-2.5 px-3 rounded-l-lg cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('dayIndex')} className="py-2.5 px-3 cursor-pointer hover:text-white">Day</th>
                <th onClick={() => handleSort('confirmed')} className="py-2.5 px-3 cursor-pointer hover:text-white">Confirmed</th>
                <th onClick={() => handleSort('dailyConfirmed')} className="py-2.5 px-3 cursor-pointer hover:text-white">Daily New</th>
                <th onClick={() => handleSort('rolling7Confirmed')} className="py-2.5 px-3 cursor-pointer hover:text-white">7d Rolling</th>
                <th onClick={() => handleSort('deaths')} className="py-2.5 px-3 cursor-pointer hover:text-white text-rose-400">Deaths</th>
                <th onClick={() => handleSort('recovered')} className="py-2.5 px-3 cursor-pointer hover:text-white text-emerald-400">Recovered</th>
                <th onClick={() => handleSort('active')} className="py-2.5 px-3 cursor-pointer hover:text-white text-amber-400">Active</th>
                <th onClick={() => handleSort('cfr')} className="py-2.5 px-3 cursor-pointer hover:text-white">CFR %</th>
                <th onClick={() => handleSort('rtEstimate')} className="py-2.5 px-3 rounded-r-lg cursor-pointer hover:text-white">Rt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {currentRecords.map((row) => (
                <tr key={row.date} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-white font-sans font-medium">{row.date}</td>
                  <td className="py-2.5 px-3 text-slate-400">t={row.dayIndex}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{row.confirmed.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-blue-400">+{row.dailyConfirmed.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.rolling7Confirmed.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-rose-400">{row.deaths.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{row.recovered.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-amber-400">{row.active.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.cfr}%</td>
                  <td className="py-2.5 px-3 text-indigo-300">{row.rtEstimate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-slate-400">
            Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
