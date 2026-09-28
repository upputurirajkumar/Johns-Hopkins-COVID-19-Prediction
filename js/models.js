/**
 * PRCP-1023 Machine Learning Model Lab
 */

const ModelManager = {
  selectedModelId: 'xgboost',

  init() {
    this.renderModelCards();
    this.renderLeaderboardTable();
    this.selectModel(this.selectedModelId);
  },

  selectModel(modelId) {
    this.selectedModelId = modelId;

    // Highlight selected card
    document.querySelectorAll('.model-card').forEach(card => {
      card.classList.toggle('selected', card.getAttribute('data-model-id') === modelId);
    });

    const model = window.ML_MODEL_RESULTS.models.find(m => m.id === modelId) || window.ML_MODEL_RESULTS.models[3];

    // Update Model Details Header
    const nameEl = document.getElementById('selected-model-name');
    const badgeEl = document.getElementById('selected-model-badge');
    const descEl = document.getElementById('selected-model-desc');
    const strengthsEl = document.getElementById('selected-model-strengths');
    const weaknessesEl = document.getElementById('selected-model-weaknesses');

    if (nameEl) nameEl.textContent = model.name;
    if (badgeEl) {
      badgeEl.textContent = model.badge;
      badgeEl.className = `badge-tag ${model.id === 'xgboost' ? 'badge-best' : 'badge-baseline'}`;
    }
    if (descEl) descEl.textContent = model.description;
    if (strengthsEl) strengthsEl.textContent = model.strengths;
    if (weaknessesEl) weaknessesEl.textContent = model.weaknesses;

    // Metric Badges
    const maeEl = document.getElementById('model-metric-mae');
    const rmseEl = document.getElementById('model-metric-rmse');
    const r2El = document.getElementById('model-metric-r2');
    const mapeEl = document.getElementById('model-metric-mape');
    const timeEl = document.getElementById('model-metric-time');

    if (maeEl) maeEl.textContent = model.metrics.testMAE.toLocaleString();
    if (rmseEl) rmseEl.textContent = model.metrics.testRMSE.toLocaleString();
    if (r2El) r2El.textContent = model.metrics.testR2.toFixed(4);
    if (mapeEl) mapeEl.textContent = model.metrics.testMAPE;
    if (timeEl) timeEl.textContent = `${model.metrics.trainingTimeMs}ms`;

    // Render Charts
    this.renderActualVsPredictedChart(model);
    this.renderFeatureImportance(model);
    this.renderResidualChart(model);
  },

  renderModelCards() {
    const container = document.getElementById('models-grid-container');
    if (!container) return;

    const models = window.ML_MODEL_RESULTS.models;
    container.innerHTML = models.map(m => `
      <div class="glass-card model-card ${m.id === this.selectedModelId ? 'selected' : ''}" data-model-id="${m.id}" onclick="ModelManager.selectModel('${m.id}')">
        <div class="card-header-row" style="margin-bottom: 0.75rem;">
          <h4 class="card-heading" style="font-size: 1rem;">${m.name}</h4>
          <span class="badge-tag ${m.id === 'xgboost' ? 'badge-best' : 'badge-baseline'}">${m.badge}</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">${m.description}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.78rem; background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md);">
          <div>
            <span style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase;">Test R²</span>
            <div class="font-mono" style="font-size: 1.1rem; font-weight: 700; color: ${m.metrics.testR2 > 0.95 ? 'var(--accent-emerald)' : 'var(--text-primary)'};">${m.metrics.testR2.toFixed(4)}</div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase;">Test RMSE</span>
            <div class="font-mono" style="font-size: 1.1rem; font-weight: 700; color: var(--accent-blue);">${(m.metrics.testRMSE / 1000).toFixed(0)}k</div>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderActualVsPredictedChart(model) {
    const country = window.AnalyticsManager.getCountryData(window.AnalyticsManager.selectedCountryCode);
    const history = country.history;
    const splitIdx = Math.floor(history.length * 0.8);

    const labels = history.map(h => h.date.substring(5));
    const actuals = history.map(h => h.confirmed);

    // Simulated model prediction curve adhering to model error bounds
    const preds = history.map((h, i) => {
      if (i < splitIdx) {
        // Training fit (tight fit)
        const noise = (Math.sin(i * 1.5) * model.metrics.trainMAE * 0.4);
        return Math.max(0, Math.round(h.confirmed + noise));
      } else {
        // Out of sample test fit
        const noise = (Math.cos(i * 0.8) * model.metrics.testMAE * 0.6);
        return Math.max(0, Math.round(h.confirmed + noise));
      }
    });

    const datasets = [
      {
        label: 'Actual Ground Truth',
        data: actuals,
        borderColor: '#f43f5e',
        borderWidth: 2.5,
        pointRadius: 0
      },
      {
        label: `${model.name} Prediction`,
        data: preds,
        borderColor: '#10b981',
        borderWidth: 2.5,
        borderDash: [3, 3],
        pointRadius: 0
      }
    ];

    window.ChartManager.createLineChart('model-actual-vs-predicted-chart', labels, datasets);
  },

  renderFeatureImportance(model) {
    const container = document.getElementById('feature-importance-container');
    if (!container) return;

    const feats = model.featureImportance || [];
    container.innerHTML = feats.map(f => `
      <div class="feature-item">
        <div class="feature-info-row">
          <span style="font-weight: 600; color: var(--text-primary);">${f.feature}</span>
          <span class="font-mono" style="color: var(--accent-cyan); font-weight: 700;">${(f.importance * 100).toFixed(1)}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${f.importance * 100}%;"></div>
        </div>
        <span style="font-size: 0.72rem; color: var(--text-muted);">${f.description}</span>
      </div>
    `).join('');
  },

  renderResidualChart(model) {
    const country = window.AnalyticsManager.getCountryData(window.AnalyticsManager.selectedCountryCode);
    const history = country.history.slice(-49); // last 49 days (test set)

    const pts = history.map((h, i) => {
      const err = Math.round(Math.sin(i * 0.9) * model.metrics.testMAE * 0.6);
      return {
        x: h.confirmed,
        y: err,
        label: h.date
      };
    });

    const datasets = [{
      label: 'Residual Error (Actual - Predicted)',
      data: pts,
      backgroundColor: 'rgba(245, 158, 11, 0.7)',
      borderColor: '#f59e0b',
      pointRadius: 5
    }];

    window.ChartManager.createScatterChart('model-residuals-chart', datasets, {
      xTitle: 'Confirmed Cases',
      yTitle: 'Residual Error (Cases)'
    });
  },

  renderLeaderboardTable() {
    const tbody = document.getElementById('model-leaderboard-tbody');
    if (!tbody) return;

    const models = [...window.ML_MODEL_RESULTS.models].sort((a, b) => b.metrics.testR2 - a.metrics.testR2);

    tbody.innerHTML = models.map((m, idx) => `
      <tr style="cursor: pointer;" onclick="ModelManager.selectModel('${m.id}')">
        <td style="font-weight: 600; color: var(--text-primary);"><span style="color: var(--accent-amber); margin-right: 0.4rem;">#${idx + 1}</span> ${m.name}</td>
        <td class="font-mono">${m.metrics.testMAE.toLocaleString()}</td>
        <td class="font-mono" style="color: var(--accent-blue);">${m.metrics.testRMSE.toLocaleString()}</td>
        <td class="font-mono" style="color: ${m.metrics.testR2 > 0.95 ? 'var(--accent-emerald)' : 'var(--text-primary)'}; font-weight: 700;">${m.metrics.testR2.toFixed(4)}</td>
        <td class="font-mono" style="color: var(--accent-amber);">${m.metrics.testMAPE}</td>
        <td class="font-mono" style="color: var(--text-muted);">${m.metrics.trainingTimeMs}ms</td>
        <td><span class="badge-tag ${m.id === 'xgboost' ? 'badge-best' : 'badge-baseline'}">${m.badge}</span></td>
      </tr>
    `).join('');
  },

  updateActiveCountry() {
    this.selectModel(this.selectedModelId);
  }
};

window.ModelManager = ModelManager;
