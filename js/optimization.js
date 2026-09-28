/**
 * PRCP-1023 Hyperparameter Optimization Module
 */

const OptimizationManager = {
  init() {
    this.renderSearchSpaceTable();
    this.renderComparisonMetrics();
    this.renderOptimizationChart();
  },

  renderSearchSpaceTable() {
    const tbody = document.getElementById('opt-search-space-tbody');
    if (!tbody) return;

    const items = window.ML_MODEL_RESULTS.optimization.searchSpace;
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><code style="color: var(--accent-cyan); font-weight: 600;">${item.param}</code></td>
        <td class="font-mono" style="color: var(--text-secondary);">${item.searchRange}</td>
        <td><span class="badge-tag badge-best font-mono">${item.bestValue}</span></td>
        <td style="color: var(--text-primary); font-size: 0.8rem;">${item.rationale}</td>
      </tr>
    `).join('');
  },

  renderComparisonMetrics() {
    const comp = window.ML_MODEL_RESULTS.optimization.beforeAfterComparison;
    
    const maeRedEl = document.getElementById('opt-mae-reduction');
    const rmseRedEl = document.getElementById('opt-rmse-reduction');
    const r2GainEl = document.getElementById('opt-r2-gain');
    const mapeRedEl = document.getElementById('opt-mape-reduction');

    if (maeRedEl) maeRedEl.textContent = comp.improvement.maeReduction;
    if (rmseRedEl) rmseRedEl.textContent = comp.improvement.rmseReduction;
    if (r2GainEl) r2GainEl.textContent = comp.improvement.r2Gain;
    if (mapeRedEl) mapeRedEl.textContent = comp.improvement.mapeReduction;

    const baseTable = document.getElementById('opt-comparison-tbody');
    if (baseTable) {
      baseTable.innerHTML = `
        <tr>
          <td style="font-weight: 600;">${comp.baseline.name}</td>
          <td class="font-mono">${comp.baseline.testMAE.toLocaleString()}</td>
          <td class="font-mono">${comp.baseline.testRMSE.toLocaleString()}</td>
          <td class="font-mono">${comp.baseline.testR2.toFixed(4)}</td>
          <td class="font-mono">${comp.baseline.testMAPE}</td>
        </tr>
        <tr style="background: rgba(16, 185, 129, 0.08);">
          <td style="font-weight: 700; color: var(--accent-emerald);">★ ${comp.optimized.name}</td>
          <td class="font-mono" style="color: var(--accent-emerald); font-weight: 700;">${comp.optimized.testMAE.toLocaleString()}</td>
          <td class="font-mono" style="color: var(--accent-emerald); font-weight: 700;">${comp.optimized.testRMSE.toLocaleString()}</td>
          <td class="font-mono" style="color: var(--accent-emerald); font-weight: 700;">${comp.optimized.testR2.toFixed(4)}</td>
          <td class="font-mono" style="color: var(--accent-emerald); font-weight: 700;">${comp.optimized.testMAPE}</td>
        </tr>
      `;
    }
  },

  renderOptimizationChart() {
    const labels = ['MAE Error', 'RMSE Error'];
    const comp = window.ML_MODEL_RESULTS.optimization.beforeAfterComparison;

    const datasets = [
      {
        label: 'Baseline (Default XGBoost)',
        data: [comp.baseline.testMAE, comp.baseline.testRMSE],
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
        borderRadius: 6
      },
      {
        label: 'Optimized (RandomizedSearchCV)',
        data: [comp.optimized.testMAE, comp.optimized.testRMSE],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      }
    ];

    window.ChartManager.createBarChart('optimization-comparison-chart', labels, datasets);
  }
};

window.OptimizationManager = OptimizationManager;
