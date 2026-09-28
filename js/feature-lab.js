/**
 * PRCP-1023 Feature Engineering Lab Module
 */

const FeatureLab = {
  init() {
    this.renderFeatureTable();
    this.renderPipelineVisualizer();
  },

  renderFeatureTable() {
    const tbody = document.getElementById('feature-dictionary-tbody');
    if (!tbody) return;

    const feats = window.PROJECT_META.featureDictionary;
    tbody.innerHTML = feats.map(f => `
      <tr>
        <td><code style="color: var(--accent-cyan); font-weight: 600;">${f.name}</code></td>
        <td><span class="badge-tag badge-baseline">${f.type}</span></td>
        <td style="color: var(--text-secondary);">${f.desc}</td>
        <td style="color: var(--text-primary); font-weight: 500;">${f.purpose}</td>
      </tr>
    `).join('');
  },

  renderPipelineVisualizer() {
    const container = document.getElementById('feature-pipeline-container');
    if (!container) return;

    const stages = [
      { step: '01', title: 'Raw Time-Series', desc: 'Cumulative JHU date vectors (1/22/20 - 9/21/20)', color: 'var(--accent-blue)' },
      { step: '02', title: 'Date Unpivoting', desc: 'Melting matrix to relational format (Date, Country, Confirmed)', color: 'var(--accent-cyan)' },
      { step: '03', title: 'Lag Engineering', desc: 'Generating Lag-1, Lag-7, and Lag-14 auto-regressive vectors', color: 'var(--accent-indigo)' },
      { step: '04', title: 'Rolling Statistics', desc: '7-day backward moving mean & moving standard deviation', color: 'var(--accent-purple)' },
      { step: '05', title: 'Growth Velocity', desc: 'Daily percentage growth rate derivative ((C_t - C_{t-1})/C_{t-1})', color: 'var(--accent-emerald)' },
      { step: '06', title: 'ML-Ready Matrix', desc: 'Feature matrix X (195x8) & Target Vector y for model training', color: 'var(--accent-amber)' }
    ];

    container.innerHTML = stages.map(s => `
      <div class="pipeline-node" style="border-top: 3px solid ${s.color};">
        <span class="pipeline-node-num">STAGE ${s.step}</span>
        <h4 class="pipeline-node-title">${s.title}</h4>
        <p class="pipeline-node-desc">${s.desc}</p>
      </div>
    `).join('');
  }
};

window.FeatureLab = FeatureLab;
