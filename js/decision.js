/**
 * PRCP-1023 Decision Intelligence & Healthcare Strategy Matrix
 */

const DecisionManager = {
  init() {
    this.renderDecisionCards();
  },

  renderDecisionCards() {
    const container = document.getElementById('decision-matrix-container');
    if (!container) return;

    const country = window.AnalyticsManager.getCountryData(window.AnalyticsManager.selectedCountryCode);
    const activePer100k = country.population > 0 ? Math.round((country.totalActive / country.population) * 100000) : 100;
    const estICU = Math.round(country.totalActive * 0.012);
    const estHosp = Math.round(country.totalActive * 0.045);

    const cards = [
      {
        category: "Hospital Critical Care Surge",
        status: activePer100k > 50 ? "status-critical" : "status-warning",
        statusText: activePer100k > 50 ? "High Critical Care Load" : "Moderate Surge Buffer",
        title: "Intensive Care Unit (ICU) & Oxygen Reserves",
        finding: `Current active infection pool (${country.totalActive.toLocaleString()}) demands ~${estICU.toLocaleString()} ICU beds and ~${estHosp.toLocaleString()} acute hospital beds.`,
        application: "Deploy tiered surge protocols: convert intermediate care wards into temporary ICUs, establish decentralized oxygen filling stations, and maintain emergency ventilator maintenance rotations.",
        limitation: "Model estimates acute beds purely from positive testing cases; asymptomatic cases and differential regional hospitalization rates may alter true bedside demand by ±20%."
      },
      {
        category: "Public Health Surveillance & Testing",
        status: country.cfr > 3.0 ? "status-warning" : "status-healthy",
        statusText: country.cfr > 3.0 ? "Enhanced Testing Indicated" : "Surveillance Stabilized",
        title: "Targeted RT-PCR & Sentinel Wastewater Monitoring",
        finding: `Case Fatality Rate is currently ${country.cfr}% with effective reproduction Rt ~${country.history[country.history.length - 1]?.rtEstimate || 1.05}.`,
        application: "Scale mobile RT-PCR testing vans across high-density transit corridors and municipal markets; implement municipal sewage genomic sampling to detect emerging mutations 10-14 days prior to clinical case spikes.",
        limitation: "Test positivity metrics are subject to testing capacity constraints and administrative reporting delays."
      },
      {
        category: "Vulnerable Cohorts & Shielding",
        status: "status-warning",
        statusText: "Priority Protection Required",
        title: "Long-Term Care & High-Comorbidity Protection",
        finding: "Historical data demonstrates that mortality clusters disproportionately in comorbid and senior demographics even during localized case plateaus.",
        application: "Implement mandatory bi-weekly rapid screening for all nursing home personnel, supply high-grade N95 respirators, and prioritize early administration of antiviral therapeutics.",
        limitation: "Dataset does not contain demographic age or comorbidity breakdowns; vulnerability interventions are inferred from macro CFR correlations."
      },
      {
        category: "Dynamic Containment & Macro Policy",
        status: "status-healthy",
        statusText: "Evidence-Based Calibration",
        title: "Targeted Micro-Containment vs Universal Restrictions",
        finding: `Doubling period is currently estimated at ~${country.doublingTimeDays} days, indicating non-explosive but sustained community circulation.`,
        application: "Enforce indoor ventilation air-exchange standards (minimum 6 ACH) and high-density indoor masking rather than economy-wide blanket lockdowns to preserve economic vitality while suppressing superspreading events.",
        limitation: "Policy decisions require localized district-level granularity beyond sovereign national aggregations."
      }
    ];

    container.innerHTML = cards.map(c => `
      <div class="glass-card decision-card">
        <div class="card-header-row" style="margin-bottom: 0.5rem;">
          <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--accent-cyan); letter-spacing: 0.05em;">${c.category}</span>
          <span style="font-size: 0.72rem; display: flex; align-items: center; color: var(--text-secondary);">
            <span class="status-indicator ${c.status}"></span>
            ${c.statusText}
          </span>
        </div>
        
        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${c.title}</h4>

        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-blue);">
          <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-blue); margin-bottom: 0.2rem;">Data Finding (Authoritative)</div>
          <p style="font-size: 0.82rem; color: var(--text-primary);">${c.finding}</p>
        </div>

        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-emerald);">
          <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-emerald); margin-bottom: 0.2rem;">Possible Public Health Application</div>
          <p style="font-size: 0.82rem; color: var(--text-primary);">${c.application}</p>
        </div>

        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-amber);">
          <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-amber); margin-bottom: 0.2rem;">Scientific & Model Limitation</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">${c.limitation}</p>
        </div>
      </div>
    `).join('');
  },

  updateActiveCountry() {
    this.renderDecisionCards();
  }
};

window.DecisionManager = DecisionManager;
