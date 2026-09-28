/**
 * PRCP-1023 30-Day Forecast Studio & Policy Sandbox
 */

const ForecastManager = {
  activeCountryKey: 'India',
  policyContainment: 30, // 0 - 100%
  policyMasks: 50, // 0 - 100%
  policyVaccines: 0.3, // % per day

  init() {
    this.bindEvents();
    this.renderForecastView();
  },

  bindEvents() {
    const countrySelect = document.getElementById('forecast-country-select');
    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => {
        this.activeCountryKey = e.target.value;
        this.renderForecastView();
      });
    }

    const sliderContainment = document.getElementById('slider-containment');
    const sliderMasks = document.getElementById('slider-masks');
    const sliderVaccines = document.getElementById('slider-vaccines');

    if (sliderContainment) {
      sliderContainment.addEventListener('input', (e) => {
        this.policyContainment = parseInt(e.target.value);
        document.getElementById('val-containment').textContent = `${this.policyContainment}%`;
        this.renderForecastChart();
        this.renderHealthcareBurden();
      });
    }

    if (sliderMasks) {
      sliderMasks.addEventListener('input', (e) => {
        this.policyMasks = parseInt(e.target.value);
        document.getElementById('val-masks').textContent = `${this.policyMasks}%`;
        this.renderForecastChart();
        this.renderHealthcareBurden();
      });
    }

    if (sliderVaccines) {
      sliderVaccines.addEventListener('input', (e) => {
        this.policyVaccines = parseFloat(e.target.value);
        document.getElementById('val-vaccines').textContent = `${this.policyVaccines}%`;
        this.renderForecastChart();
        this.renderHealthcareBurden();
      });
    }
  },

  getForecastData() {
    return window.FORECAST_DATA[this.activeCountryKey] || window.FORECAST_DATA.India;
  },

  renderForecastView() {
    const data = this.getForecastData();

    // Summary Cards
    const startEl = document.getElementById('fc-start-cases');
    const endEl = document.getElementById('fc-end-cases');
    const totalEl = document.getElementById('fc-total-added');
    const avgDailyEl = document.getElementById('fc-avg-daily');
    const growthEl = document.getElementById('fc-growth-pct');

    if (startEl) startEl.textContent = data.startingForecast.toLocaleString();
    if (endEl) endEl.textContent = data.endingForecast.toLocaleString();
    if (totalEl) totalEl.textContent = `+${data.totalForecastedNewCases.toLocaleString()}`;
    if (avgDailyEl) avgDailyEl.textContent = `~${data.averageDailyNewCases.toLocaleString()} / day`;
    if (growthEl) growthEl.textContent = `+${data.growthPercentage}%`;

    this.renderForecastChart();
    this.renderHealthcareBurden();
    this.renderForecastTable();
  },

  renderForecastChart() {
    const data = this.getForecastData();
    const cData = window.COUNTRIES_COVID_DATA.find(c => c.country.toLowerCase().includes(data.country.toLowerCase())) || window.COUNTRIES_COVID_DATA[1];
    
    // Last 45 historical observations
    const recentHist = cData.history.slice(-45);
    const histLabels = recentHist.map(h => h.date.substring(5));
    const histCases = recentHist.map(h => h.confirmed);

    // 30 Future days
    const fcLabels = data.projections.map(p => p.date.substring(5));
    
    // Policy scenario reduction factor
    const policyMultiplier = 1 - (this.policyContainment * 0.0035 + this.policyMasks * 0.0018 + this.policyVaccines * 0.08);

    const baselineForecastCases = data.projections.map(p => p.predictedConfirmed);
    const scenarioForecastCases = data.projections.map((p, idx) => {
      const added = p.predictedConfirmed - data.baseConfirmed;
      return Math.round(data.baseConfirmed + added * Math.max(0.4, policyMultiplier));
    });

    const upperCI = data.projections.map(p => p.upperBound);
    const lowerCI = data.projections.map(p => p.lowerBound);

    const allLabels = [...histLabels, ...fcLabels];

    // Combine historical and future
    const histSeries = [...histCases, ...new Array(30).fill(null)];
    const baselineSeries = [...new Array(45).fill(null)];
    baselineSeries[44] = histCases[44]; // connect point
    baselineForecastCases.forEach(v => baselineSeries.push(v));

    const scenarioSeries = [...new Array(45).fill(null)];
    scenarioSeries[44] = histCases[44]; // connect point
    scenarioForecastCases.forEach(v => scenarioSeries.push(v));

    const datasets = [
      {
        label: 'Historical Observed (Actual)',
        data: histSeries,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 2.5,
        fill: false,
        pointRadius: 0
      },
      {
        label: 'Unmitigated Baseline Forecast',
        data: baselineSeries,
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderDash: [4, 4],
        pointRadius: 0
      },
      {
        label: 'Policy Scenario Projection (XGBoost)',
        data: scenarioSeries,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        borderWidth: 3,
        pointRadius: 0
      }
    ];

    window.ChartManager.createLineChart('main-forecast-chart', allLabels, datasets);
  },

  renderHealthcareBurden() {
    const data = this.getForecastData();
    const policyMultiplier = 1 - (this.policyContainment * 0.0035 + this.policyMasks * 0.0018 + this.policyVaccines * 0.08);
    const finalDay = data.projections[data.projections.length - 1];

    const hospBeds = Math.round(finalDay.hospitalBedsNeeded * policyMultiplier);
    const icuBeds = Math.round(finalDay.icuBedsNeeded * policyMultiplier);
    const vents = Math.round(finalDay.ventilatorsNeeded * policyMultiplier);
    const oxygen = Number((finalDay.oxygenTonsPerDay * policyMultiplier).toFixed(1));

    const hospEl = document.getElementById('burden-hospital-beds');
    const icuEl = document.getElementById('burden-icu-beds');
    const ventEl = document.getElementById('burden-vents');
    const oxEl = document.getElementById('burden-oxygen');

    if (hospEl) hospEl.textContent = hospBeds.toLocaleString();
    if (icuEl) icuEl.textContent = icuBeds.toLocaleString();
    if (ventEl) ventEl.textContent = vents.toLocaleString();
    if (oxEl) oxEl.textContent = `${oxygen} Tons/day`;
  },

  renderForecastTable() {
    const tbody = document.getElementById('forecast-table-tbody');
    if (!tbody) return;

    const data = this.getForecastData();
    tbody.innerHTML = data.projections.map(p => `
      <tr>
        <td class="font-mono">Day +${p.day}</td>
        <td style="font-weight: 500;">${p.date}</td>
        <td class="font-mono" style="font-weight: 700; color: var(--accent-blue);">${p.predictedConfirmed.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--accent-cyan);">+${p.predictedDailyNew.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--text-muted);">${p.lowerBound.toLocaleString()} – ${p.upperBound.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--accent-amber);">${p.icuBedsNeeded.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--accent-emerald);">${p.oxygenTonsPerDay} T</td>
      </tr>
    `).join('');
  },

  updateActiveCountry(country) {
    if (window.FORECAST_DATA[country.country]) {
      this.activeCountryKey = country.country;
    } else if (window.FORECAST_DATA[country.code]) {
      this.activeCountryKey = country.code;
    }
    const select = document.getElementById('forecast-country-select');
    if (select) select.value = this.activeCountryKey;
    this.renderForecastView();
  },

  exportForecastData() {
    const data = this.getForecastData();
    const rows = [
      ['Day', 'Date', 'Predicted_Confirmed', 'Daily_New', 'Lower_95_CI', 'Upper_95_CI', 'ICU_Beds_Needed', 'Oxygen_Tons_Per_Day'],
      ...data.projections.map(p => [
        `+${p.day}`,
        p.date,
        p.predictedConfirmed,
        p.predictedDailyNew,
        p.lowerBound,
        p.upperBound,
        p.icuBedsNeeded,
        p.oxygenTonsPerDay
      ])
    ];

    window.UIManager.exportToCSV(`COVID19_30Day_Forecast_${data.country}.csv`, rows);
  }
};

window.ForecastManager = ForecastManager;
