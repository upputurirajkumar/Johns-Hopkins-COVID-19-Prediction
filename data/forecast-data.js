/**
 * PRCP-1023 30-Day Forward Forecast Dataset
 * Generates forward projections starting September 22, 2020 through October 21, 2020 for India and key countries
 */

function _build30DayForecast(countryName, baseConfirmed, initialDailyRate, growthDecay, population) {
  const points = [];
  let curr = baseConfirmed;
  let rate = initialDailyRate;
  const startDate = new Date("2020-09-22");

  for (let d = 1; d <= 30; d++) {
    const fDate = new Date(startDate.getTime() + (d - 1) * 86400000);
    const dateStr = fDate.toISOString().split('T')[0];

    // Epidemic velocity evolution
    rate = Math.max(500, Math.round(rate * growthDecay));
    curr += rate;

    // Uncertainty interval expanding with sqrt(time)
    const margin = Math.round(rate * Math.sqrt(d) * 1.5);
    const lower = Math.round(curr - margin);
    const upper = Math.round(curr + margin);

    // Active cases window estimate (~14-day rolling infectious pool)
    const activeEst = Math.round(rate * 14);
    const hospBeds = Math.round(activeEst * 0.045);
    const icuBeds = Math.round(activeEst * 0.012);
    const vents = Math.round(activeEst * 0.004);
    const oxygenTons = Number((hospBeds * 0.015).toFixed(1));

    points.push({
      day: d,
      date: dateStr,
      predictedConfirmed: curr,
      predictedDailyNew: rate,
      lowerBound: lower,
      upperBound: upper,
      estimatedActiveInfections: activeEst,
      hospitalBedsNeeded: hospBeds,
      icuBedsNeeded: icuBeds,
      ventilatorsNeeded: vents,
      oxygenTonsPerDay: oxygenTons
    });
  }

  const startCases = points[0].predictedConfirmed;
  const endCases = points[points.length - 1].predictedConfirmed;
  const totalAdded = endCases - baseConfirmed;
  const avgDaily = Math.round(totalAdded / 30);

  return {
    country: countryName,
    horizonDays: 30,
    startDate: "2020-09-22",
    endDate: "2020-10-21",
    baseConfirmed: baseConfirmed,
    startingForecast: startCases,
    endingForecast: endCases,
    totalForecastedNewCases: totalAdded,
    averageDailyNewCases: avgDaily,
    growthPercentage: Number(((totalAdded / baseConfirmed) * 100).toFixed(2)),
    projections: points
  };
}

const FORECAST_DATA = {
  // India (Primary Notebook Deep-Dive Focus)
  India: _build30DayForecast("India", 5487580, 86500, 0.994, 1380004385),
  // United States
  US: _build30DayForecast("United States", 6856884, 42000, 0.996, 331000000),
  // Brazil
  Brazil: _build30DayForecast("Brazil", 4558040, 28000, 0.991, 212559417),
  // Global Total
  Global: _build30DayForecast("Global Total", 31252119, 290000, 0.998, 7800000000),
  // Russia
  Russia: _build30DayForecast("Russia", 1105048, 6200, 1.002, 145934462),
  // United Kingdom
  UK: _build30DayForecast("United Kingdom", 401122, 4500, 1.015, 67886011)
};

window.FORECAST_DATA = FORECAST_DATA;
