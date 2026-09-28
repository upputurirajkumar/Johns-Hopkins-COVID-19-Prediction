/**
 * PRCP-1023 Global COVID Analytics Engine & Interactive Visuals
 */

const AnalyticsManager = {
  selectedCountryCode: 'GLOBAL',
  activeTrendMetric: 'rolling', // 'cumulative' | 'daily' | 'rolling' | 'deaths_rec'
  activeScale: 'linear', // 'linear' | 'log'

  init() {
    this.populateCountrySelectors();
    this.renderTopCountriesTable();
    this.renderGlobalCharts();
    this.renderDay0AlignmentChart();
    this.renderCFRScatterChart();
    this.renderCorrelationMatrix();
  },

  getCountryData(code) {
    return window.COUNTRIES_COVID_DATA.find(c => c.code === code) || window.COUNTRIES_COVID_DATA[0];
  },

  populateCountrySelectors() {
    const selects = document.querySelectorAll('.country-select-sync');
    selects.forEach(select => {
      select.innerHTML = '';
      window.COUNTRIES_COVID_DATA.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.flag} ${c.country} (${c.code})`;
        if (c.code === this.selectedCountryCode) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        this.selectCountry(e.target.value);
      });
    });
  },

  selectCountry(code) {
    this.selectedCountryCode = code;

    // Sync all selector dropdowns
    document.querySelectorAll('.country-select-sync').forEach(s => s.value = code);

    // Update Overview Cards
    const country = this.getCountryData(code);
    this.updateCountryOverviewKPIs(country);
    this.renderGlobalCharts();

    // Trigger Model & Forecast views to sync with selected country
    if (window.ModelManager && window.ModelManager.updateActiveCountry) {
      window.ModelManager.updateActiveCountry(country);
    }
    if (window.ForecastManager && window.ForecastManager.updateActiveCountry) {
      window.ForecastManager.updateActiveCountry(country);
    }
    if (window.DecisionManager && window.DecisionManager.updateActiveCountry) {
      window.DecisionManager.updateActiveCountry(country);
    }
  },

  updateCountryOverviewKPIs(country) {
    const nameEl = document.getElementById('overview-country-name');
    const isoEl = document.getElementById('overview-country-iso');
    const popEl = document.getElementById('overview-country-pop');

    if (nameEl) nameEl.textContent = `${country.flag} ${country.country}`;
    if (isoEl) isoEl.textContent = `ISO: ${country.code}`;
    if (popEl) popEl.textContent = country.code === 'GLOBAL' ? 'Global World Population' : `Pop: ${country.population.toLocaleString()}`;

    // Animated KPIs
    window.UIManager.animateCounter('kpi-confirmed', country.totalConfirmed);
    window.UIManager.animateCounter('kpi-active', country.totalActive);
    window.UIManager.animateCounter('kpi-recovered', country.totalRecovered);
    window.UIManager.animateCounter('kpi-deaths', country.totalDeaths);

    const cfrEl = document.getElementById('kpi-cfr-val');
    const recRateEl = document.getElementById('kpi-rec-rate-val');
    const doublingEl = document.getElementById('kpi-doubling-val');
    const rtEl = document.getElementById('kpi-rt-val');

    if (cfrEl) cfrEl.textContent = `${country.cfr}%`;
    if (recRateEl) recRateEl.textContent = `${country.recoveryRate}%`;
    if (doublingEl) doublingEl.textContent = `~${country.doublingTimeDays} Days`;
    
    const latest = country.history[country.history.length - 1];
    if (rtEl) rtEl.textContent = latest ? latest.rtEstimate : '1.05';
  },

  setTrendMetric(metric) {
    this.activeTrendMetric = metric;
    document.querySelectorAll('.btn-trend-metric').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-metric') === metric);
    });
    this.renderGlobalCharts();
  },

  toggleScale() {
    this.activeScale = this.activeScale === 'linear' ? 'log' : 'linear';
    const btn = document.getElementById('btn-scale-toggle');
    if (btn) btn.textContent = this.activeScale === 'log' ? 'Scale: Log₁₀' : 'Scale: Linear';
    this.renderGlobalCharts();
  },

  renderGlobalCharts() {
    const country = this.getCountryData(this.selectedCountryCode);
    const history = country.history;
    const labels = history.map(h => h.date.substring(5)); // MM-DD

    let datasets = [];

    if (this.activeTrendMetric === 'cumulative') {
      datasets = [
        {
          label: 'Cumulative Confirmed',
          data: history.map(h => h.confirmed),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          borderWidth: 2.5,
          tension: 0.2
        },
        {
          label: 'Recovered',
          data: history.map(h => h.recovered),
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'Deceased',
          data: history.map(h => h.deaths),
          borderColor: '#f43f5e',
          borderWidth: 2,
          pointRadius: 0
        }
      ];
    } else if (this.activeTrendMetric === 'daily') {
      datasets = [
        {
          label: 'Daily New Cases',
          data: history.map(h => h.dailyConfirmed),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.4)',
          borderWidth: 1.5,
          type: 'bar'
        },
        {
          label: '7-Day Moving Average',
          data: history.map(h => h.rolling7Confirmed),
          borderColor: '#f59e0b',
          borderWidth: 3,
          type: 'line',
          pointRadius: 0
        }
      ];
    } else if (this.activeTrendMetric === 'rolling') {
      datasets = [
        {
          label: '7-Day Moving Avg (Cases)',
          data: history.map(h => h.rolling7Confirmed),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
          borderWidth: 3,
          pointRadius: 0
        },
        {
          label: '7-Day Moving Avg (Deaths)',
          data: history.map(h => h.rolling7Deaths * 10), // scaled for dual visibility
          borderColor: '#f43f5e',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 0
        }
      ];
    } else if (this.activeTrendMetric === 'deaths_rec') {
      datasets = [
        {
          label: 'Recoveries',
          data: history.map(h => h.recovered),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          borderWidth: 2.5
        },
        {
          label: 'Fatalities',
          data: history.map(h => h.deaths),
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.2)',
          fill: true,
          borderWidth: 2.5
        }
      ];
    }

    window.ChartManager.createLineChart('main-epidemic-chart', labels, datasets, {
      yScaleType: this.activeScale === 'log' ? 'logarithmic' : 'linear'
    });
  },

  renderDay0AlignmentChart() {
    const topCountries = ['USA', 'IND', 'BRA', 'RUS', 'GBR', 'ITA'];
    const colors = { USA: '#3b82f6', IND: '#f59e0b', BRA: '#10b981', RUS: '#a855f7', GBR: '#ec4899', ITA: '#06b6d4' };

    let maxDays = 0;
    const series = topCountries.map(code => {
      const c = this.getCountryData(code);
      const aligned = c.history.filter(p => p.confirmed >= 1000).map((p, idx) => ({ x: idx, y: p.confirmed }));
      if (aligned.length > maxDays) maxDays = aligned.length;
      return {
        label: `${c.country} (${c.code})`,
        data: aligned.map(pt => pt.y),
        borderColor: colors[code] || '#94a3b8',
        borderWidth: 2.5,
        pointRadius: 0
      };
    });

    const labels = Array.from({ length: Math.min(maxDays, 180) }, (_, i) => `Day ${i}`);

    window.ChartManager.createLineChart('day0-alignment-chart', labels, series, {
      yScaleType: 'logarithmic'
    });
  },

  renderCFRScatterChart() {
    const countries = window.COUNTRIES_COVID_DATA.filter(c => c.code !== 'GLOBAL');
    const pts = countries.map(c => ({
      x: c.recoveryRate,
      y: c.cfr,
      label: c.country
    }));

    const datasets = [{
      label: 'Nations (CFR vs Recovery %)',
      data: pts,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      pointRadius: 7,
      pointHoverRadius: 9
    }];

    window.ChartManager.createScatterChart('cfr-scatter-chart', datasets, {
      xTitle: 'Clinical Recovery Rate (%)',
      yTitle: 'Case Fatality Rate (CFR %)'
    });
  },

  renderCorrelationMatrix() {
    const container = document.getElementById('correlation-matrix-grid');
    if (!container) return;

    const features = ['Days_Outbreak', 'Lag_1', 'Lag_7', 'Rolling_Mean', 'Growth_Rate', 'Confirmed (Target)'];
    const matrix = [
      [1.00, 0.98, 0.96, 0.97, -0.61, 0.96],
      [0.98, 1.00, 0.99, 0.99, -0.42, 0.99],
      [0.96, 0.99, 1.00, 0.98, -0.38, 0.97],
      [0.97, 0.99, 0.98, 1.00, -0.35, 0.98],
      [-0.61, -0.42, -0.38, -0.35, 1.00, -0.32],
      [0.96, 0.99, 0.97, 0.98, -0.32, 1.00]
    ];

    let html = '<table class="data-table" style="font-family: JetBrains Mono; text-align: center;"><thead><tr><th style="text-align: left;">Feature</th>';
    features.forEach(f => html += `<th>${f}</th>`);
    html += '</tr></thead><tbody>';

    matrix.forEach((row, i) => {
      html += `<tr><td style="text-align: left; font-weight: 600; font-family: Inter;">${features[i]}</td>`;
      row.forEach((val, j) => {
        const bg = val > 0.8 ? 'rgba(16, 185, 129, 0.2)' : val > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(244, 63, 94, 0.2)';
        const color = val > 0.8 ? '#10b981' : val > 0 ? '#38bdf8' : '#f43f5e';
        html += `<td style="background: ${bg}; color: ${color}; font-weight: 600;">${val >= 0 ? '+' : ''}${val.toFixed(2)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    container.innerHTML = html;
  },

  renderTopCountriesTable() {
    const tbody = document.getElementById('top-countries-tbody');
    if (!tbody) return;

    const list = window.COUNTRIES_COVID_DATA.filter(c => c.code !== 'GLOBAL');
    tbody.innerHTML = list.map((c, idx) => `
      <tr style="cursor: pointer;" onclick="AnalyticsManager.selectCountry('${c.code}')">
        <td><span style="color: var(--text-muted); margin-right: 0.4rem;">${idx + 1}.</span> <strong>${c.flag} ${c.country}</strong></td>
        <td class="font-mono">${c.totalConfirmed.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--accent-rose);">${c.totalDeaths.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--accent-emerald);">${c.totalRecovered.toLocaleString()}</td>
        <td class="font-mono">${c.cfr}%</td>
        <td class="font-mono">${c.recoveryRate}%</td>
        <td><span class="badge-tag ${c.code === this.selectedCountryCode ? 'badge-best' : 'badge-baseline'}">${c.code === this.selectedCountryCode ? 'Active View' : 'Select'}</span></td>
      </tr>
    `).join('');
  },

  refreshActiveCharts() {
    this.renderGlobalCharts();
    this.renderDay0AlignmentChart();
    this.renderCFRScatterChart();
  }
};

window.AnalyticsManager = AnalyticsManager;
