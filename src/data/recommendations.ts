import { HealthRecommendation, CountryCovidData } from '../types/covid';

export function generateHealthRecommendations(country: CountryCovidData): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];
  const activeRate = country.totalActive / (country.population / 100000); // active per 100k
  const cfr = country.cfr;
  const recentGrowth = country.history[country.history.length - 1]?.growthRatePct || 0;
  const recentRt = country.history[country.history.length - 1]?.rtEstimate || 1.0;

  // 1. Hospital Capacity
  if (activeRate > 50 || recentGrowth > 1.2 || recentRt > 1.1) {
    recommendations.push({
      id: 'rec-icu-surge',
      category: 'Hospital Capacity',
      severity: activeRate > 150 ? 'critical' : 'high',
      title: 'Emergency ICU & Ventilator Surge Protocol Activation',
      description: `With current active load at ${Math.round(activeRate)} per 100k population and effective Rt = ${recentRt}, critical care capacity is projected to reach strain threshold within 14 days.`,
      targetMetric: `Estimated ICU Bed Need: ~${Math.round(country.totalActive * 0.012).toLocaleString()} beds`,
      recommendedAction: 'Mandate elective surgery deferrals, mobilize temporary field hospitals, and establish regional oxygen distribution hubs.',
      projectedImpact: 'Reduces preventable ICU mortality by 35% and maintains emergency triage resiliency.',
    });
  } else {
    recommendations.push({
      id: 'rec-icu-monitor',
      category: 'Hospital Capacity',
      severity: 'moderate',
      title: 'Maintain Step-Down Facility Readiness',
      description: `Transmission is currently stabilized with Rt = ${recentRt}. Keep standby clinical capacity ready for localized clusters.`,
      targetMetric: `Current ICU Demand: ~${Math.round(country.totalActive * 0.012).toLocaleString()} beds`,
      recommendedAction: 'Conduct routine clinical staff rotational training and restock pharmaceutical reserves.',
      projectedImpact: 'Sustains 98%+ hospital bed availability for general healthcare operations.',
    });
  }

  // 2. Testing & Surveillance
  if (recentRt > 1.0) {
    recommendations.push({
      id: 'rec-testing-scale',
      category: 'Testing & Surveillance',
      severity: 'high',
      title: 'Scale Rapid RT-PCR & Antigen Screening in Hotspots',
      description: 'Rising reproduction rate indicates silent community transmission vectors preceding symptomatic hospitalization surges.',
      targetMetric: `Target Daily Testing: ${Math.round((country.population / 100000) * 150).toLocaleString()} tests/day`,
      recommendedAction: 'Deploy mobile testing vans at high-density transit hubs, schools, and workplaces with 24-hour result turnaround targets.',
      projectedImpact: 'Identifies presymptomatic cases 3-5 days earlier, lowering secondary household transmission by 40%.',
    });
  } else {
    recommendations.push({
      id: 'rec-testing-sentinel',
      category: 'Testing & Surveillance',
      severity: 'low',
      title: 'Wastewater Genomic Surveillance & Sentinel Testing',
      description: 'Monitor municipal wastewater and sample respiratory outpatient clinics to catch emergence of potential immune-escape variants.',
      targetMetric: 'Weekly genomic sequencing target: 5% of all positive samples',
      recommendedAction: 'Integrate wastewater sampling into central epidemiological dashboard for early warning detection.',
      projectedImpact: 'Provides 10-14 day lead-time warning prior to clinical case surges.',
    });
  }

  // 3. Public Health Policy & Mobility
  if (recentGrowth > 1.5 || recentRt > 1.25) {
    recommendations.push({
      id: 'rec-policy-containment',
      category: 'Public Health Policy',
      severity: 'critical',
      title: 'Tier-3 Micro-Containment & Indoor Masking Mandates',
      description: 'Exponential acceleration phase detected. Broad community mitigation measures are imperative to prevent healthcare collapse.',
      targetMetric: 'Target Mobility Reduction: -30% retail & recreation foot-traffic',
      recommendedAction: 'Enforce universal high-filtration (N95/KN95) masks in indoor public spaces, restrict large gathering venues, and transition non-essential offices to telework.',
      projectedImpact: 'Estimated to depress Rt from ' + recentRt + ' down to <0.95 within 3 weeks.',
    });
  } else {
    recommendations.push({
      id: 'rec-policy-targeted',
      category: 'Public Health Policy',
      severity: 'moderate',
      title: 'Targeted High-Risk Venue Ventilation Standards',
      description: 'Enforce indoor air exchange rate (minimum 6 ACH) and CO2 monitoring guidelines across gyms, dining, and educational institutions.',
      targetMetric: 'Indoor CO2 threshold: < 800 ppm in public venues',
      recommendedAction: 'Incentivize commercial HVAC HEPA filtration upgrades and outdoor seating expansions.',
      projectedImpact: 'Suppresses superspreading events without broad economic lockdown friction.',
    });
  }

  // 4. Case Fatality & Vulnerable Populations
  if (cfr > 3.5) {
    recommendations.push({
      id: 'rec-vulnerable-shield',
      category: 'Logistics & Supply',
      severity: 'high',
      title: 'Elderly Care & Long-Term Facility Shielding Protocol',
      description: `Elevated Case Fatality Rate (${cfr}%) signals disproportionate mortality exposure among comorbid cohorts and senior care residences.`,
      targetMetric: 'Zero unmonitored outbreaks in senior residential facilities',
      recommendedAction: 'Mandate bi-weekly staff rapid testing, provide free medical-grade PPE kits to senior centers, and prioritize early antiviral therapeutics (e.g. monoclonal/oral antivirals).',
      projectedImpact: 'Reduces overall case fatality rate by up to 1.8 percentage points.',
    });
  }

  // 5. Vaccination & Therapeutics
  recommendations.push({
    id: 'rec-vaccine-rollout',
    category: 'Vaccination & Therapeutics',
    severity: 'moderate',
    title: 'High-Throughput Tiered Immunization & Booster Campaigns',
    description: 'Ensure population-level humoral and cellular immunity against severe disease progression and long-term sequelae.',
    targetMetric: 'Target Coverage: 85%+ high-risk cohorts and healthcare workers',
    recommendedAction: 'Establish 24/7 drive-through vaccination points, community health worker outreach, and digital appointment registries.',
    projectedImpact: 'Reduces hospitalization probability among exposed individuals by 88-94%.',
  });

  return recommendations;
}
