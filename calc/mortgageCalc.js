/**
 * Pure mortgage calculation engine, extracted from סימולטור_משכנתא.html.
 * No DOM/global `state` dependency — everything the original code read from
 * `state` is now passed in explicitly via the `ctx` object, so this module
 * can run anywhere (e.g. a Firebase Cloud Function).
 *
 * ctx shape (all optional, sensible defaults applied):
 * {
 *   indexCalcMode: 'annual' | 'monthly',
 *   monthlyIndices: [{ month: 'YYYY-MM', rate: number }],
 *   financialDate: 'YYYY-MM-DD',          // mortgage start date fallback
 *   currentMortgagePurpose: 'housing' | 'allPurpose' | 'mixed',
 *   generalRateBands: { [routeKey]: [{from,to,anchor,margin}] },
 *   allPurposeRateBands: { [routeKey]: [{from,to,anchor,margin}] },
 *   datedRateBands: [{date,routeKey,purpose,from,to,anchor,margin}]
 * }
 *
 * params shape: { 'מדד': number, 'דולר': number, 'אירו': number }  (annual % as decimal)
 *
 * route (rt) shape mirrors the original UI route objects: amount, years,
 * anchor, margin, useGeneralRate, dailyInterest, board, balloon,
 * balloonMonths, indexType, indexPct, exitFee, sharePct, loanPurpose,
 * purposeSplit, changeMonths, customAnnualIndex, forceActualIndex,
 * startDateOverride, kind, rateType, anchorType, takenToday, useDatedRate.
 */

function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }

function PMT(r, n, pv) {
  if (n <= 0) return 0;
  if (r === 0) return -pv / n;
  return -(r * pv) / (1 - Math.pow(1 + r, -n));
}

function today() { return new Date().toISOString().slice(0, 10); }

function indexExpect(type, params) {
  if (type === 'מדד') return num(params['מדד']);
  if (type === 'דולר') return num(params['דולר']);
  if (type === 'אירו') return num(params['אירו']);
  return 0;
}

function monthKey(dateStr, offset = 0) {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  if (isNaN(d)) return '';
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

function monthlyIndexRate(paymentMonth, forceMonthly, startDate, ctx) {
  if (!forceMonthly && ctx.indexCalcMode !== 'monthly') return null;
  const key = monthKey(startDate || ctx.financialDate || today(), paymentMonth - 1);
  const row = (ctx.monthlyIndices || []).find(x => x.month === key);
  return row ? num(row.rate) : 0;
}

function routeAnnualIndex(rt, params) {
  return rt.customAnnualIndex == null || rt.customAnnualIndex === ''
    ? indexExpect(rt.indexType, params)
    : num(rt.customAnnualIndex);
}

function displayedAnnualIndex(rt, params, ctx) {
  if (rt.indexType !== 'מדד' || (!rt.forceActualIndex && ctx.indexCalcMode !== 'monthly')) {
    return routeAnnualIndex(rt, params);
  }
  return (ctx.monthlyIndices || []).reduce((p, x) => p * (1 + num(x.rate)), 1) - 1;
}

function routePurposeParts(rt) {
  const split = rt.purposeSplit;
  if (!split) return [];
  const housing = Math.max(0, num(split.housing));
  const allPurpose = Math.max(0, num(split.allPurpose));
  const total = housing + allPurpose;
  if (total <= 0) return [];
  const parts = [];
  if (housing > 0) parts.push({ purpose: 'housing', share: housing / total });
  if (allPurpose > 0) parts.push({ purpose: 'allPurpose', share: allPurpose / total });
  return parts;
}

function mergeSplitRouteCalcs(parts) {
  const maxN = parts.reduce((max, part) => Math.max(max, part.calc.n || 0), 0);
  const amount = parts.reduce((sum, part) => sum + num(part.amount), 0);
  const out = {
    S: 0, T: 0, n: maxN, L: [], baseL: [], basePrin: [], indexBal: [], M: [], prin: [],
    intr: [], idxEff: [], idxPrin: [], idxIntr: [], cum: [],
    annualRate: 0, enteredAnnualRate: 0, invalidNegativeRate: false, effRate: 0, annualIndex: 0
  };
  const arrayFields = ['L', 'baseL', 'basePrin', 'indexBal', 'M', 'prin', 'intr', 'idxEff', 'idxPrin', 'idxIntr', 'cum'];
  parts.forEach(part => {
    const c = part.calc, weight = amount > 0 ? num(part.amount) / amount : 0;
    out.S += num(c.S); out.T += num(c.T);
    out.annualRate += num(c.annualRate) * weight;
    out.enteredAnnualRate += num(c.enteredAnnualRate) * weight;
    out.effRate += num(c.effRate) * weight;
    out.annualIndex += num(c.annualIndex) * weight;
    out.invalidNegativeRate = out.invalidNegativeRate || !!c.invalidNegativeRate;
    arrayFields.forEach(field => {
      for (let i = 0; i <= maxN; i++) out[field][i] = num(out[field][i]) + num(c[field]?.[i]);
    });
  });
  return out;
}

function inferRouteKind(rt) {
  if (rt.kind) return rt.kind;
  if (rt.anchorType === 'פריים') return 'prime';
  return rt.rateType === 'משתנה' ? 'variable' : 'fixed';
}

function generalRateKey(rt) {
  const kind = inferRouteKind(rt);
  if (kind === 'prime') return 'prime';
  if (kind === 'fixed') return rt.indexType === 'מדד' ? 'fixedLinked' : 'fixedUnlinked';
  const months = Math.round(num(rt.changeMonths));
  const linked = rt.indexType === 'מדד';
  if (months === 36) return linked ? 'variable36Linked' : 'variable36Unlinked';
  if (months === 60) return linked ? 'variable60Linked' : 'variable60Unlinked';
  if (months === 18 || months === 24) return linked ? 'variable18_24Linked' : 'variable18_24Unlinked';
  return linked ? 'variable60Linked' : 'variable60Unlinked';
}

function defaultGeneralRates() {
  return {
    fixedUnlinked: { anchor: .0462, margin: 0 },
    fixedLinked: { anchor: .0462, margin: 0 },
    variable36Unlinked: { anchor: .047, margin: 0 },
    variable36Linked: { anchor: .047, margin: 0 },
    variable60Linked: { anchor: .047, margin: 0 },
    variable60Unlinked: { anchor: .047, margin: 0 },
    variable18_24Linked: { anchor: .047, margin: 0 },
    variable18_24Unlinked: { anchor: .047, margin: 0 },
    prime: { anchor: .0456, margin: 0 }
  };
}

function defaultGeneralRateBands() {
  const rates = defaultGeneralRates();
  return Object.fromEntries(Object.entries(rates).map(([key, rate]) => [key, [{ from: 4, to: 30, anchor: rate.anchor, margin: rate.margin }]]));
}

function normalizeGeneralRateBands(ctx) {
  if (!ctx.generalRateBands) ctx.generalRateBands = {};
  if (!ctx.allPurposeRateBands) ctx.allPurposeRateBands = {};
  const defaults = defaultGeneralRateBands();
  Object.keys(defaults).forEach(key => {
    if (!Array.isArray(ctx.generalRateBands[key]) || !ctx.generalRateBands[key].length) {
      ctx.generalRateBands[key] = defaults[key].map(rate => ({ ...rate }));
    }
    ctx.generalRateBands[key].sort((a, b) => num(a.from) - num(b.from));
    if (!Array.isArray(ctx.allPurposeRateBands[key]) || !ctx.allPurposeRateBands[key].length) {
      ctx.allPurposeRateBands[key] = ctx.generalRateBands[key].map(rate => ({ ...rate }));
    }
    ctx.allPurposeRateBands[key].sort((a, b) => num(a.from) - num(b.from));
  });
}

function datedRateForRoute(rt, years, ctx) {
  if (!rt.takenToday && !rt.useDatedRate) return null;
  const rows = (ctx.datedRateBands || []).filter(row => {
    const purpose = rt.loanPurpose || (ctx.currentMortgagePurpose === 'allPurpose' ? 'allPurpose' : 'housing');
    const samePurpose = !row.purpose || row.purpose === 'all' || row.purpose === purpose;
    return samePurpose && row.routeKey === generalRateKey(rt) && years >= num(row.from) && years <= num(row.to)
      && String(row.date || '') <= String(rt.startDateOverride || today());
  }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return rows.length ? rows[0] : null;
}

function generalRateForRoute(rt, years, ctx) {
  normalizeGeneralRateBands(ctx);
  const dated = datedRateForRoute(rt, years, ctx);
  if (dated) return dated;
  const purpose = rt.loanPurpose || (ctx.currentMortgagePurpose === 'allPurpose' ? 'allPurpose' : 'housing');
  const source = purpose === 'allPurpose' ? ctx.allPurposeRateBands : ctx.generalRateBands;
  const bands = source[generalRateKey(rt)] || [];
  const exact = bands.find(b => years >= num(b.from) && years <= num(b.to));
  if (exact) return exact;
  return bands.reduce((best, b) => Math.abs(years - (num(b.from) + num(b.to)) / 2) < Math.abs(years - (num(best.from) + num(best.to)) / 2) ? b : best, bands[0]);
}

/** מחשב לוח סילוקין למסלול בודד ("שעון" יחיד). */
function calcRoute(rt, params, ctx) {
  const E = num(rt.amount), Dy = num(rt.years);
  const purposeParts = routePurposeParts(rt);
  if (E > 0 && purposeParts.length > 1 && !rt._purposeSplitBypass) {
    return mergeSplitRouteCalcs(purposeParts.map(part => ({
      amount: E * part.share,
      calc: calcRoute({ ...rt, _purposeSplitBypass: true, purposeSplit: null, loanPurpose: part.purpose, amount: E * part.share }, params, ctx)
    })));
  }
  const n = Math.trunc(Dy * 12);
  const selectedRate = rt.useGeneralRate ? generalRateForRoute(rt, Dy, ctx) : { anchor: num(rt.anchor), margin: num(rt.margin) };
  const enteredAnnualRate = num(selectedRate.anchor) + num(selectedRate.margin); // עוגן + מרווח
  const annualRate = Math.max(0, enteredAnnualRate);
  const monthlyRate = rt.dailyInterest ? Math.pow(1 + annualRate / 365, 365 / 12) - 1 : annualRate / 12;
  const out = {
    S: 0, T: 0, n: n, L: [], baseL: [], basePrin: [], indexBal: [], M: [], prin: [], intr: [],
    idxEff: [], idxPrin: [], idxIntr: [], cum: [], annualRate: annualRate,
    enteredAnnualRate: enteredAnnualRate, invalidNegativeRate: enteredAnnualRate < 0,
    effRate: Math.pow(1 + monthlyRate, 12) - 1,
    annualIndex: displayedAnnualIndex(rt, params, ctx)
  };
  if (n <= 0 || E <= 0) return out;
  const r = monthlyRate;
  const F = rt.board || 'שפיצר', G = rt.balloon || '', H = num(rt.balloonMonths);
  const isBalloon = (G === 'בלון מלא' || G === 'בלון חלקי');
  const isGrace = (G === 'גרייס מלא' || G === 'גרייס חלקי');
  const L = [0], B = [0], N = [0], O = [0], P = [0], R = [0], M = [0];
  let cumM = 0, cumO = 0, sumR = 0, T = 0;
  const idxStop = isBalloon ? H : n;
  for (let m = 1; m <= n; m++) {
    const actualMonthly = rt.indexType === 'מדד' ? monthlyIndexRate(m, !!rt.forceActualIndex, rt.startDateOverride, ctx) : null;
    const idx = (actualMonthly === null ? routeAnnualIndex(rt, params) / 12 : actualMonthly) * num(rt.indexPct);
    if (m === 1) { L[m] = (Dy * 12 > 1) ? E : 0; B[m] = L[m]; }
    else {
      if (Dy * 12 >= m) {
        if (isBalloon) { L[m] = (H === m || H + 1 > m) ? P[m - 1] : 0; }
        else if (G === 'גרייס מלא') { L[m] = (H + 1 === m) ? P[m - 1] + sumR : P[m - 1]; }
        else { L[m] = P[m - 1]; }
      } else L[m] = 0;
      B[m] = Math.max(0, B[m - 1] - (out.basePrin[m - 1] || 0));
    }
    O[m] = L[m] * r;
    if (L[m] > 0) {
      if (isBalloon) N[m] = 0;
      else if (isGrace && H >= m) N[m] = 0;
      else if (F === 'שפיצר') N[m] = -PMT(r, n - m + 1, L[m]) - O[m];
      else N[m] = L[m] / (n - m + 1);
    } else N[m] = 0;
    P[m] = (L[m] - N[m]) * (idx + 1);
    R[m] = O[m] + N[m];
    sumR += R[m];
    if (G === 'בלון מלא') M[m] = (H === m) ? P[m] : 0;
    else if (G === 'בלון חלקי') M[m] = (H > m) ? O[m] : (H === m ? P[m] + O[m] : 0);
    else if (G === 'גרייס מלא') M[m] = (H >= m) ? 0 : (F === 'שפיצר' ? -PMT(r, n - m + 1, L[m]) : R[m]);
    else if (G === 'גרייס חלקי') M[m] = (H >= m) ? O[m] : (F === 'שפיצר' ? -PMT(r, n - m + 1, L[m]) : R[m]);
    else M[m] = R[m];
    cumM += M[m]; cumO += O[m];
    let q;
    if (G === 'בלון חלקי') q = (H === m) ? cumM : 0;
    else if (G === 'בלון מלא') q = (H === m) ? cumM + cumO : 0;
    else q = cumM;
    if (m === idxStop) T = q;
    const idxPrin = (L[m] - N[m]) * idx, idxIntr = O[m] * idx;
    const basePrin = L[m] > 0 ? N[m] * (B[m] / L[m]) : 0;
    out.basePrin[m] = basePrin;
    out.baseL[m] = B[m];
    out.indexBal[m] = Math.max(0, L[m] - B[m]);
    out.prin[m] = N[m]; out.intr[m] = O[m]; out.idxPrin[m] = idxPrin; out.idxIntr[m] = idxIntr;
    out.idxEff[m] = idxPrin + idxIntr; out.cum[m] = cumM;
  }
  out.S = M[1] || 0; out.T = T; out.L = L; out.M = M;
  return out;
}

/** מחשב תמהיל ("שעון") שלם מכמה מסלולים. */
function calcMix(routes, params, ctx) {
  let E = 0, wYears = 0, wRate = 0, S = 0, T = 0, maxN = 0, totalInterest = 0, exitFee = 0;
  const per = [];
  routes.forEach(rt => {
    const c = calcRoute(rt, params, ctx); per.push(c);
    const e = num(rt.amount);
    E += e; wYears += e * num(rt.years); wRate += e * c.annualRate; S += c.S; T += c.T;
    exitFee += num(rt.exitFee);
    totalInterest += c.intr.reduce((sum, value) => sum + num(value), 0);
    if (c.n > maxN) maxN = c.n;
  });
  const indexation = Math.max(0, T - E - totalInterest);
  return {
    E,
    exitFee,
    totalAmount: E + exitFee,
    principal: E,
    avgYears: E > 0 ? wYears / E : 0,
    avgRate: E > 0 ? wRate / E : 0,
    firstPay: S,
    total: T,
    interest: totalInterest,
    indexation,
    per,
    maxN
  };
}

module.exports = {
  num, PMT, today, indexExpect, monthKey, monthlyIndexRate,
  routeAnnualIndex, displayedAnnualIndex, routePurposeParts, mergeSplitRouteCalcs,
  inferRouteKind, generalRateKey, defaultGeneralRates, defaultGeneralRateBands,
  normalizeGeneralRateBands, datedRateForRoute, generalRateForRoute,
  calcRoute, calcMix
};
