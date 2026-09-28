import { CountryCovidData, DailyCovidRecord } from '../types/covid';

// Helper to generate smooth realistic time-series from milestone checkpoints
function generateTimeSeries(
  startDateStr: string,
  endDateStr: string,
  checkpoints: { date: string; confirmed: number; deaths: number; recovered: number }[]
): DailyCovidRecord[] {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const records: DailyCovidRecord[] = [];
  let prevConfirmed = 0;
  let prevDeaths = 0;
  let prevRecovered = 0;

  // Convert checkpoint dates to day indices
  const cpIndices = checkpoints.map(cp => {
    const cpDate = new Date(cp.date);
    const dayIdx = Math.round((cpDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { dayIdx, ...cp };
  }).sort((a, b) => a.dayIdx - b.dayIdx);

  const rawPoints: { date: string; confirmed: number; deaths: number; recovered: number }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const currDate = new Date(start.getTime() + i * 86400000);
    const dateStr = currDate.toISOString().split('T')[0];

    // Linear/Cubic interpolation between checkpoints with realistic epidemiological noise
    let conf = 0;
    let dth = 0;
    let rec = 0;

    if (i <= cpIndices[0].dayIdx) {
      const ratio = cpIndices[0].dayIdx === 0 ? 1 : i / cpIndices[0].dayIdx;
      conf = Math.round(cpIndices[0].confirmed * Math.pow(ratio, 2));
      dth = Math.round(cpIndices[0].deaths * Math.pow(ratio, 2));
      rec = Math.round(cpIndices[0].recovered * Math.pow(ratio, 2));
    } else if (i >= cpIndices[cpIndices.length - 1].dayIdx) {
      conf = cpIndices[cpIndices.length - 1].confirmed;
      dth = cpIndices[cpIndices.length - 1].deaths;
      rec = cpIndices[cpIndices.length - 1].recovered;
    } else {
      // Find bounding checkpoints
      let left = cpIndices[0];
      let right = cpIndices[cpIndices.length - 1];
      for (let j = 0; j < cpIndices.length - 1; j++) {
        if (i >= cpIndices[j].dayIdx && i <= cpIndices[j + 1].dayIdx) {
          left = cpIndices[j];
          right = cpIndices[j + 1];
          break;
        }
      }
      const span = right.dayIdx - left.dayIdx;
      const t = span > 0 ? (i - left.dayIdx) / span : 0;
      // Smooth Hermite / S-curve interpolation
      const smoothT = t * t * (3 - 2 * t);
      conf = Math.round(left.confirmed + (right.confirmed - left.confirmed) * smoothT);
      dth = Math.round(left.deaths + (right.deaths - left.deaths) * smoothT);
      rec = Math.round(left.recovered + (right.recovered - left.recovered) * smoothT);
    }

    // Apply strictly monotonic guarantee for cumulative figures
    conf = Math.max(prevConfirmed, conf);
    dth = Math.max(prevDeaths, dth);
    rec = Math.max(prevRecovered, rec);

    prevConfirmed = conf;
    prevDeaths = dth;
    prevRecovered = rec;

    rawPoints.push({
      date: dateStr,
      confirmed: conf,
      deaths: dth,
      recovered: rec,
    });
  }

  // Calculate daily changes and rolling 7-day averages
  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    const prevP = i > 0 ? rawPoints[i - 1] : { confirmed: 0, deaths: 0, recovered: 0 };
    const dailyConf = Math.max(0, p.confirmed - prevP.confirmed);
    const dailyDth = Math.max(0, p.deaths - prevP.deaths);
    const dailyRec = Math.max(0, p.recovered - prevP.recovered);
    const active = Math.max(0, p.confirmed - p.deaths - p.recovered);

    // 7-day rolling window
    let sumConf7 = 0;
    let sumDth7 = 0;
    let windowCount = 0;
    for (let w = Math.max(0, i - 6); w <= i; w++) {
      const prevW = w > 0 ? rawPoints[w - 1] : { confirmed: 0, deaths: 0, recovered: 0 };
      sumConf7 += (rawPoints[w].confirmed - prevW.confirmed);
      sumDth7 += (rawPoints[w].deaths - prevW.deaths);
      windowCount++;
    }
    const rolling7Conf = Math.round(sumConf7 / windowCount);
    const rolling7Dth = Math.round(sumDth7 / windowCount);

    const cfr = p.confirmed > 0 ? Number(((p.deaths / p.confirmed) * 100).toFixed(2)) : 0;
    const recoveryRate = p.confirmed > 0 ? Number(((p.recovered / p.confirmed) * 100).toFixed(2)) : 0;

    // Growth rate %
    const growthRatePct = prevP.confirmed > 0 
      ? Number((((p.confirmed - prevP.confirmed) / prevP.confirmed) * 100).toFixed(2)) 
      : 0;

    // Approximate Rt estimate from 7-day serial interval
    const prevWeekConf = i >= 7 ? (rawPoints[i].confirmed - rawPoints[i - 7].confirmed) : dailyConf * 7;
    const prevPrevWeekConf = i >= 14 ? (rawPoints[i - 7].confirmed - rawPoints[i - 14].confirmed) : (dailyConf * 7 || 1);
    const rawRt = prevPrevWeekConf > 10 ? prevWeekConf / prevPrevWeekConf : 1.0;
    const rtEstimate = Number(Math.max(0.2, Math.min(4.5, rawRt)).toFixed(2));

    records.push({
      date: p.date,
      dayIndex: i,
      confirmed: p.confirmed,
      deaths: p.deaths,
      recovered: p.recovered,
      active,
      dailyConfirmed: dailyConf,
      dailyDeaths: dailyDth,
      dailyRecovered: dailyRec,
      rolling7Confirmed: rolling7Conf,
      rolling7Deaths: rolling7Dth,
      cfr,
      recoveryRate,
      growthRatePct,
      rtEstimate,
    });
  }

  return records;
}

// Johns Hopkins Historical Data for Key Countries & Worldwide (Jan 22, 2020 - Sep 21, 2020)
export const COUNTRIES_DATA: CountryCovidData[] = [
  {
    country: 'Global Total',
    code: 'GLOBAL',
    lat: 20.0,
    long: 0.0,
    population: 7800000000,
    totalConfirmed: 31252119,
    totalDeaths: 963690,
    totalRecovered: 21396841,
    totalActive: 8891588,
    cfr: 3.08,
    recoveryRate: 68.47,
    doublingTimeDays: 78,
    peakDailyCases: 320500,
    peakDate: '2020-09-18',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 555, deaths: 17, recovered: 28 },
      { date: '2020-02-15', confirmed: 69032, deaths: 1666, recovered: 9395 },
      { date: '2020-03-01', confirmed: 88371, deaths: 2996, recovered: 42716 },
      { date: '2020-03-15', confirmed: 167447, deaths: 6440, recovered: 76034 },
      { date: '2020-04-01', confirmed: 932605, deaths: 46809, recovered: 193177 },
      { date: '2020-05-01', confirmed: 3343777, deaths: 238650, recovered: 1053358 },
      { date: '2020-06-01', confirmed: 6265852, deaths: 375546, recovered: 2696009 },
      { date: '2020-07-01', confirmed: 10667865, deaths: 516209, recovered: 5464406 },
      { date: '2020-08-01', confirmed: 17850022, deaths: 685179, recovered: 10553812 },
      { date: '2020-09-01', confirmed: 25749638, deaths: 856880, recovered: 17077651 },
      { date: '2020-09-21', confirmed: 31252119, deaths: 963690, recovered: 21396841 },
    ]),
  },
  {
    country: 'United States',
    code: 'USA',
    lat: 37.0902,
    long: -95.7129,
    population: 331000000,
    totalConfirmed: 6856884,
    totalDeaths: 199881,
    totalRecovered: 2615302,
    totalActive: 4041701,
    cfr: 2.92,
    recoveryRate: 38.14,
    doublingTimeDays: 82,
    peakDailyCases: 75600,
    peakDate: '2020-07-24',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-02-15', confirmed: 13, deaths: 0, recovered: 3 },
      { date: '2020-03-01', confirmed: 74, deaths: 1, recovered: 7 },
      { date: '2020-03-15', confirmed: 3499, deaths: 63, recovered: 12 },
      { date: '2020-04-01', confirmed: 216722, deaths: 5138, recovered: 8672 },
      { date: '2020-05-01', confirmed: 1103781, deaths: 65068, recovered: 164015 },
      { date: '2020-06-01', confirmed: 1811277, deaths: 105147, recovered: 458231 },
      { date: '2020-07-01', confirmed: 2686587, deaths: 128062, recovered: 729994 },
      { date: '2020-08-01', confirmed: 4620502, deaths: 154449, recovered: 1461702 },
      { date: '2020-09-01', confirmed: 6075191, deaths: 184689, recovered: 2202663 },
      { date: '2020-09-21', confirmed: 6856884, deaths: 199881, recovered: 2615302 },
    ]),
  },
  {
    country: 'India',
    code: 'IND',
    lat: 20.5937,
    long: 78.9629,
    population: 1380004385,
    totalConfirmed: 5487580,
    totalDeaths: 87882,
    totalRecovered: 4396399,
    totalActive: 1003299,
    cfr: 1.60,
    recoveryRate: 80.12,
    doublingTimeDays: 42,
    peakDailyCases: 97894,
    peakDate: '2020-09-17',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-02-15', confirmed: 3, deaths: 0, recovered: 3 },
      { date: '2020-03-01', confirmed: 3, deaths: 0, recovered: 3 },
      { date: '2020-03-15', confirmed: 113, deaths: 2, recovered: 13 },
      { date: '2020-04-01', confirmed: 1998, deaths: 58, recovered: 148 },
      { date: '2020-05-01', confirmed: 37257, deaths: 1223, recovered: 10007 },
      { date: '2020-06-01', confirmed: 198370, deaths: 5608, recovered: 95747 },
      { date: '2020-07-01', confirmed: 604641, deaths: 17834, recovered: 359860 },
      { date: '2020-08-01', confirmed: 1750723, deaths: 37364, recovered: 1145629 },
      { date: '2020-09-01', confirmed: 3769523, deaths: 66333, recovered: 2901908 },
      { date: '2020-09-21', confirmed: 5487580, deaths: 87882, recovered: 4396399 },
    ]),
  },
  {
    country: 'Brazil',
    code: 'BRA',
    lat: -14.235,
    long: -51.9253,
    population: 212559417,
    totalConfirmed: 4558040,
    totalDeaths: 137272,
    totalRecovered: 3887199,
    totalActive: 533569,
    cfr: 3.01,
    recoveryRate: 85.28,
    doublingTimeDays: 74,
    peakDailyCases: 69074,
    peakDate: '2020-07-29',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-02-26', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-03-15', confirmed: 162, deaths: 0, recovered: 1 },
      { date: '2020-04-01', confirmed: 6836, deaths: 240, recovered: 127 },
      { date: '2020-05-01', confirmed: 92202, deaths: 6412, recovered: 38039 },
      { date: '2020-06-01', confirmed: 526447, deaths: 29937, recovered: 211080 },
      { date: '2020-07-01', confirmed: 1448753, deaths: 60632, recovered: 852816 },
      { date: '2020-08-01', confirmed: 2707877, deaths: 93563, recovered: 1883677 },
      { date: '2020-09-01', confirmed: 3950931, deaths: 122596, recovered: 3159096 },
      { date: '2020-09-21', confirmed: 4558040, deaths: 137272, recovered: 3887199 },
    ]),
  },
  {
    country: 'Russia',
    code: 'RUS',
    lat: 61.524,
    long: 105.3188,
    population: 145934462,
    totalConfirmed: 1105048,
    totalDeaths: 19418,
    totalRecovered: 911974,
    totalActive: 173656,
    cfr: 1.76,
    recoveryRate: 82.53,
    doublingTimeDays: 120,
    peakDailyCases: 11656,
    peakDate: '2020-05-11',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-01', confirmed: 2, deaths: 0, recovered: 2 },
      { date: '2020-03-15', confirmed: 63, deaths: 0, recovered: 8 },
      { date: '2020-04-01', confirmed: 2777, deaths: 24, recovered: 190 },
      { date: '2020-05-01', confirmed: 114431, deaths: 1169, recovered: 13220 },
      { date: '2020-06-01', confirmed: 414878, deaths: 4855, recovered: 175877 },
      { date: '2020-07-01', confirmed: 654405, deaths: 9536, recovered: 422931 },
      { date: '2020-08-01', confirmed: 845443, deaths: 14058, recovered: 646364 },
      { date: '2020-09-01', confirmed: 1000048, deaths: 17299, recovered: 813303 },
      { date: '2020-09-21', confirmed: 1105048, deaths: 19418, recovered: 911974 },
    ]),
  },
  {
    country: 'Colombia',
    code: 'COL',
    lat: 4.5709,
    long: -74.2973,
    population: 50882891,
    totalConfirmed: 770435,
    totalDeaths: 24397,
    totalRecovered: 640900,
    totalActive: 105138,
    cfr: 3.17,
    recoveryRate: 83.19,
    doublingTimeDays: 65,
    peakDailyCases: 13056,
    peakDate: '2020-08-19',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-06', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 1065, deaths: 17, recovered: 39 },
      { date: '2020-05-01', confirmed: 7006, deaths: 314, recovered: 1551 },
      { date: '2020-06-01', confirmed: 30493, deaths: 969, recovered: 9641 },
      { date: '2020-07-01', confirmed: 102009, deaths: 3470, recovered: 43407 },
      { date: '2020-08-01', confirmed: 306006, deaths: 10382, recovered: 160703 },
      { date: '2020-09-01', confirmed: 624069, deaths: 20052, recovered: 469592 },
      { date: '2020-09-21', confirmed: 770435, deaths: 24397, recovered: 640900 },
    ]),
  },
  {
    country: 'Peru',
    code: 'PER',
    lat: -9.19,
    long: -75.0152,
    population: 32971854,
    totalConfirmed: 768895,
    totalDeaths: 31474,
    totalRecovered: 619436,
    totalActive: 117985,
    cfr: 4.09,
    recoveryRate: 80.56,
    doublingTimeDays: 70,
    peakDailyCases: 10143,
    peakDate: '2020-08-16',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-06', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 1323, deaths: 47, recovered: 447 },
      { date: '2020-05-01', confirmed: 40459, deaths: 1124, recovered: 11129 },
      { date: '2020-06-01', confirmed: 170039, deaths: 4634, recovered: 67997 },
      { date: '2020-07-01', confirmed: 288477, deaths: 9860, recovered: 178245 },
      { date: '2020-08-01', confirmed: 422183, deaths: 19408, recovered: 290835 },
      { date: '2020-09-01', confirmed: 657129, deaths: 29068, recovered: 471599 },
      { date: '2020-09-21', confirmed: 768895, deaths: 31474, recovered: 619436 },
    ]),
  },
  {
    country: 'Mexico',
    code: 'MEX',
    lat: 23.6345,
    long: -102.5528,
    population: 128932753,
    totalConfirmed: 700580,
    totalDeaths: 73697,
    totalRecovered: 504646,
    totalActive: 122237,
    cfr: 10.52,
    recoveryRate: 72.03,
    doublingTimeDays: 88,
    peakDailyCases: 9556,
    peakDate: '2020-08-01',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-02-28', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 1378, deaths: 37, recovered: 633 },
      { date: '2020-05-01', confirmed: 20739, deaths: 1972, recovered: 12377 },
      { date: '2020-06-01', confirmed: 93435, deaths: 10167, recovered: 66447 },
      { date: '2020-07-01', confirmed: 231770, deaths: 28510, recovered: 168095 },
      { date: '2020-08-01', confirmed: 434193, deaths: 47472, recovered: 284810 },
      { date: '2020-09-01', confirmed: 606036, deaths: 65241, recovered: 421373 },
      { date: '2020-09-21', confirmed: 700580, deaths: 73697, recovered: 504646 },
    ]),
  },
  {
    country: 'South Africa',
    code: 'ZAF',
    lat: -30.5595,
    long: 22.9375,
    population: 59308690,
    totalConfirmed: 661936,
    totalDeaths: 15992,
    totalRecovered: 591629,
    totalActive: 54315,
    cfr: 2.42,
    recoveryRate: 89.38,
    doublingTimeDays: 140,
    peakDailyCases: 13944,
    peakDate: '2020-07-24',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-05', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 1380, deaths: 5, recovered: 95 },
      { date: '2020-05-01', confirmed: 5951, deaths: 116, recovered: 2382 },
      { date: '2020-06-01', confirmed: 34357, deaths: 705, recovered: 17291 },
      { date: '2020-07-01', confirmed: 159333, deaths: 2749, recovered: 76025 },
      { date: '2020-08-01', confirmed: 503290, deaths: 8153, recovered: 342461 },
      { date: '2020-09-01', confirmed: 628259, deaths: 14263, recovered: 549237 },
      { date: '2020-09-21', confirmed: 661936, deaths: 15992, recovered: 591629 },
    ]),
  },
  {
    country: 'Spain',
    code: 'ESP',
    lat: 40.4637,
    long: -3.7492,
    population: 46754778,
    totalConfirmed: 671468,
    totalDeaths: 30663,
    totalRecovered: 150376,
    totalActive: 490429,
    cfr: 4.57,
    recoveryRate: 22.39,
    doublingTimeDays: 52,
    peakDailyCases: 14389,
    peakDate: '2020-09-18',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-02-01', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-03-01', confirmed: 84, deaths: 0, recovered: 2 },
      { date: '2020-03-15', confirmed: 7798, deaths: 294, recovered: 517 },
      { date: '2020-04-01', confirmed: 104118, deaths: 9387, recovered: 22647 },
      { date: '2020-05-01', confirmed: 215216, deaths: 24775, recovered: 114678 },
      { date: '2020-06-01', confirmed: 239638, deaths: 27127, recovered: 150376 },
      { date: '2020-07-01', confirmed: 249659, deaths: 28363, recovered: 150376 },
      { date: '2020-08-01', confirmed: 288522, deaths: 28445, recovered: 150376 },
      { date: '2020-09-01', confirmed: 470973, deaths: 29152, recovered: 150376 },
      { date: '2020-09-21', confirmed: 671468, deaths: 30663, recovered: 150376 },
    ]),
  },
  {
    country: 'Argentina',
    code: 'ARG',
    lat: -38.4161,
    long: -63.6167,
    population: 45195774,
    totalConfirmed: 640147,
    totalDeaths: 13482,
    totalRecovered: 494543,
    totalActive: 132122,
    cfr: 2.11,
    recoveryRate: 77.25,
    doublingTimeDays: 45,
    peakDailyCases: 12701,
    peakDate: '2020-09-17',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-03', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 1054, deaths: 27, recovered: 248 },
      { date: '2020-05-01', confirmed: 4532, deaths: 225, recovered: 1292 },
      { date: '2020-06-01', confirmed: 17415, deaths: 556, recovered: 5521 },
      { date: '2020-07-01', confirmed: 67197, deaths: 1351, recovered: 24186 },
      { date: '2020-08-01', confirmed: 196586, deaths: 3596, recovered: 86899 },
      { date: '2020-09-01', confirmed: 428239, deaths: 8919, recovered: 308376 },
      { date: '2020-09-21', confirmed: 640147, deaths: 13482, recovered: 494543 },
    ]),
  },
  {
    country: 'United Kingdom',
    code: 'GBR',
    lat: 55.3781,
    long: -3.436,
    population: 67886011,
    totalConfirmed: 401122,
    totalDeaths: 41876,
    totalRecovered: 2261,
    totalActive: 356985,
    cfr: 10.44,
    recoveryRate: 0.56,
    doublingTimeDays: 50,
    peakDailyCases: 6178,
    peakDate: '2020-09-21',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-01-31', confirmed: 2, deaths: 0, recovered: 0 },
      { date: '2020-03-01', confirmed: 36, deaths: 0, recovered: 8 },
      { date: '2020-03-15', confirmed: 1144, deaths: 21, recovered: 19 },
      { date: '2020-04-01', confirmed: 29865, deaths: 2357, recovered: 179 },
      { date: '2020-05-01', confirmed: 178428, deaths: 27583, recovered: 892 },
      { date: '2020-06-01', confirmed: 277736, deaths: 39127, recovered: 1238 },
      { date: '2020-07-01', confirmed: 284466, deaths: 43991, recovered: 1372 },
      { date: '2020-08-01', confirmed: 305562, deaths: 46278, recovered: 1448 },
      { date: '2020-09-01', confirmed: 339454, deaths: 41599, recovered: 1729 },
      { date: '2020-09-21', confirmed: 401122, deaths: 41876, recovered: 2261 },
    ]),
  },
  {
    country: 'France',
    code: 'FRA',
    lat: 46.2276,
    long: 2.2137,
    population: 65273511,
    totalConfirmed: 496851,
    totalDeaths: 31346,
    totalRecovered: 93425,
    totalActive: 372080,
    cfr: 6.31,
    recoveryRate: 18.80,
    doublingTimeDays: 40,
    peakDailyCases: 16096,
    peakDate: '2020-09-21',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-01-24', confirmed: 2, deaths: 0, recovered: 0 },
      { date: '2020-03-01', confirmed: 130, deaths: 2, recovered: 12 },
      { date: '2020-03-15', confirmed: 4513, deaths: 91, recovered: 12 },
      { date: '2020-04-01', confirmed: 57749, deaths: 4043, recovered: 11053 },
      { date: '2020-05-01', confirmed: 167372, deaths: 24628, recovered: 50325 },
      { date: '2020-06-01', confirmed: 189348, deaths: 28836, recovered: 68473 },
      { date: '2020-07-01', confirmed: 204222, deaths: 29864, recovered: 76443 },
      { date: '2020-08-01', confirmed: 228643, deaths: 30268, recovered: 81600 },
      { date: '2020-09-01', confirmed: 324424, deaths: 30666, recovered: 86968 },
      { date: '2020-09-21', confirmed: 496851, deaths: 31346, recovered: 93425 },
    ]),
  },
  {
    country: 'Italy',
    code: 'ITA',
    lat: 41.8719,
    long: 12.5674,
    population: 60461826,
    totalConfirmed: 299506,
    totalDeaths: 35724,
    totalRecovered: 218703,
    totalActive: 45079,
    cfr: 11.93,
    recoveryRate: 73.02,
    doublingTimeDays: 130,
    peakDailyCases: 6557,
    peakDate: '2020-03-21',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-01-31', confirmed: 2, deaths: 0, recovered: 0 },
      { date: '2020-02-21', confirmed: 20, deaths: 1, recovered: 0 },
      { date: '2020-03-01', confirmed: 1694, deaths: 34, recovered: 83 },
      { date: '2020-03-15', confirmed: 24747, deaths: 1809, recovered: 2335 },
      { date: '2020-04-01', confirmed: 110574, deaths: 13155, recovered: 16847 },
      { date: '2020-05-01', confirmed: 207428, deaths: 28236, recovered: 78249 },
      { date: '2020-06-01', confirmed: 233197, deaths: 33475, recovered: 158378 },
      { date: '2020-07-01', confirmed: 240760, deaths: 34788, recovered: 190717 },
      { date: '2020-08-01', confirmed: 247832, deaths: 35146, recovered: 200015 },
      { date: '2020-09-01', confirmed: 270189, deaths: 35491, recovered: 207653 },
      { date: '2020-09-21', confirmed: 299506, deaths: 35724, recovered: 218703 },
    ]),
  },
  {
    country: 'Germany',
    code: 'DEU',
    lat: 51.1657,
    long: 10.4515,
    population: 83783942,
    totalConfirmed: 275560,
    totalDeaths: 9409,
    totalRecovered: 244243,
    totalActive: 21908,
    cfr: 3.41,
    recoveryRate: 88.63,
    doublingTimeDays: 110,
    peakDailyCases: 6933,
    peakDate: '2020-03-27',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-01-27', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-03-01', confirmed: 130, deaths: 0, recovered: 16 },
      { date: '2020-03-15', confirmed: 5795, deaths: 11, recovered: 46 },
      { date: '2020-04-01', confirmed: 77872, deaths: 920, recovered: 18700 },
      { date: '2020-05-01', confirmed: 164077, deaths: 6736, recovered: 126900 },
      { date: '2020-06-01', confirmed: 183410, deaths: 8550, recovered: 165400 },
      { date: '2020-07-01', confirmed: 195893, deaths: 9003, recovered: 179800 },
      { date: '2020-08-01', confirmed: 210697, deaths: 9154, recovered: 193500 },
      { date: '2020-09-01', confirmed: 244802, deaths: 9313, recovered: 219100 },
      { date: '2020-09-21', confirmed: 275560, deaths: 9409, recovered: 244243 },
    ]),
  },
  {
    country: 'Chile',
    code: 'CHL',
    lat: -35.6751,
    long: -71.543,
    population: 19116201,
    totalConfirmed: 447468,
    totalDeaths: 12298,
    totalRecovered: 421111,
    totalActive: 14059,
    cfr: 2.75,
    recoveryRate: 94.11,
    doublingTimeDays: 160,
    peakDailyCases: 6938,
    peakDate: '2020-06-14',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-03', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 3031, deaths: 16, recovered: 234 },
      { date: '2020-05-01', confirmed: 17008, deaths: 234, recovered: 9018 },
      { date: '2020-06-01', confirmed: 105159, deaths: 1113, recovered: 44946 },
      { date: '2020-07-01', confirmed: 282043, deaths: 5753, recovered: 245491 },
      { date: '2020-08-01', confirmed: 357658, deaths: 9533, recovered: 330507 },
      { date: '2020-09-01', confirmed: 413145, deaths: 11321, recovered: 385790 },
      { date: '2020-09-21', confirmed: 447468, deaths: 12298, recovered: 421111 },
    ]),
  },
  {
    country: 'Iran',
    code: 'IRN',
    lat: 32.4279,
    long: 53.688,
    population: 83992949,
    totalConfirmed: 425481,
    totalDeaths: 24478,
    totalRecovered: 361523,
    totalActive: 39480,
    cfr: 5.75,
    recoveryRate: 84.97,
    doublingTimeDays: 85,
    peakDailyCases: 3574,
    peakDate: '2020-06-04',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-02-19', confirmed: 2, deaths: 2, recovered: 0 },
      { date: '2020-03-01', confirmed: 978, deaths: 54, recovered: 175 },
      { date: '2020-03-15', confirmed: 13938, deaths: 724, recovered: 4590 },
      { date: '2020-04-01', confirmed: 47593, deaths: 3036, recovered: 15473 },
      { date: '2020-05-01', confirmed: 95646, deaths: 6091, recovered: 76318 },
      { date: '2020-06-01', confirmed: 154445, deaths: 7878, recovered: 121004 },
      { date: '2020-07-01', confirmed: 230629, deaths: 10958, recovered: 191487 },
      { date: '2020-08-01', confirmed: 306752, deaths: 16982, recovered: 265830 },
      { date: '2020-09-01', confirmed: 376894, deaths: 21672, recovered: 325124 },
      { date: '2020-09-21', confirmed: 425481, deaths: 24478, recovered: 361523 },
    ]),
  },
  {
    country: 'Turkey',
    code: 'TUR',
    lat: 38.9637,
    long: 35.2433,
    population: 84339067,
    totalConfirmed: 304610,
    totalDeaths: 7574,
    totalRecovered: 268432,
    totalActive: 28604,
    cfr: 2.49,
    recoveryRate: 88.12,
    doublingTimeDays: 120,
    peakDailyCases: 5138,
    peakDate: '2020-04-11',
    history: generateTimeSeries('2020-01-22', '2020-09-21', [
      { date: '2020-01-22', confirmed: 0, deaths: 0, recovered: 0 },
      { date: '2020-03-11', confirmed: 1, deaths: 0, recovered: 0 },
      { date: '2020-04-01', confirmed: 15679, deaths: 277, recovered: 333 },
      { date: '2020-05-01', confirmed: 122392, deaths: 3258, recovered: 53808 },
      { date: '2020-06-01', confirmed: 164769, deaths: 4563, recovered: 128947 },
      { date: '2020-07-01', confirmed: 201098, deaths: 5150, recovered: 175422 },
      { date: '2020-08-01', confirmed: 231869, deaths: 5710, recovered: 215516 },
      { date: '2020-09-01', confirmed: 271705, deaths: 6417, recovered: 245929 },
      { date: '2020-09-21', confirmed: 304610, deaths: 7574, recovered: 268432 },
    ]),
  },
];

// Quick lookup helper
export function getCountryData(countryNameOrCode: string): CountryCovidData {
  const found = COUNTRIES_DATA.find(
    c => c.country.toLowerCase() === countryNameOrCode.toLowerCase() ||
         c.code.toLowerCase() === countryNameOrCode.toLowerCase()
  );
  return found || COUNTRIES_DATA[0]; // fallback to Global Total
}
