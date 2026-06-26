/**
 * Full "תמהילים" (mixes) calculation pipeline, extracted from
 * סימולטור_משכנתא.html. Builds on mortgageCalc.js (calcRoute/calcMix) and
 * ports everything else needed to reproduce "טען וחשב שעון" /
 * "חשב את כל השעונים": template loading, the payment-range auto-fit
 * search, purpose-split handling, and fixed-route shortening.
 *
 * Nothing here touches the DOM or a global `state` — every function takes
 * the data it needs explicitly:
 *
 *   mixState = {
 *     mixes: { current: [route...], t1: [route...], ..., t5: [route...] },
 *     mixSettings: { [key]: { takenToday: boolean } },
 *     mixCalcStatus: {},                    // written by calculateMixToRange
 *     financial: { minPay, maxPayDesired, loanAmount },
 *     currentMortgagePurpose: 'housing' | 'allPurpose' | 'mixed',
 *     currentPurposeShares: { housing, allPurpose },
 *     clockTemplates: CLOCK_TEMPLATES        // optional override
 *   }
 *
 *   params   = { 'מדד': number, 'דולר': number, 'אירו': number }
 *   ratesCtx = the ctx object from mortgageCalc.js (indexCalcMode,
 *              monthlyIndices, financialDate, generalRateBands, etc.)
 *
 * route shape: same as in mortgageCalc.js (kind, sharePct, amount, years,
 * board, balloon, balloonMonths, rateType, changeMonths, indexType,
 * indexPct, anchorType, anchor, margin, useGeneralRate, yearStep,
 * loanPurpose, purposeSplit, takenToday, dailyInterest, forceActualIndex,
 * startDateOverride, exitFee, customAnnualIndex).
 */

const {
  num, today, calcRoute, calcMix, inferRouteKind, generalRateForRoute
} = require('./mortgageCalc');

function fmt(n) { return !isFinite(n) ? '—' : Math.round(n).toLocaleString('he-IL'); }
function fmtMoney(n) { return '₪' + fmt(n); }

function blankRoute() {
  return {
    kind: 'fixed', sharePct: '', amount: '', years: 20, board: 'שפיצר', balloon: '', balloonMonths: '',
    rateType: 'קבועה', changeMonths: '', indexType: 'ללא', indexPct: 1, anchorType: '', anchor: '', margin: 0
  };
}

const CLOCK_TEMPLATES = {
  clock1: {
    name: 'שעון 1',
    routes: [
      { kind: 'fixed', sharePct: 17, indexType: 'ללא', yearStep: 5, anchor: .0462 },
      { kind: 'fixed', sharePct: 17, indexType: 'מדד', yearStep: 5, anchor: .0462 },
      { kind: 'variable', sharePct: 30, indexType: 'ללא', changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'variable', sharePct: 15, indexType: 'מדד', changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'prime', sharePct: 21, indexType: 'ללא', changeMonths: 1, yearStep: 10, anchorType: 'פריים', anchor: .0456, margin: 0 }
    ]
  },
  clock2: {
    name: 'שעון 2',
    routes: [
      { kind: 'fixed', sharePct: 33, indexType: 'ללא', yearStep: 5, anchor: .0462 },
      { kind: 'fixed', sharePct: 0, indexType: 'מדד', yearStep: 5, anchor: .0462 },
      { kind: 'variable', sharePct: 30, indexType: 'ללא', changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'variable', sharePct: 0, indexType: 'מדד', changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'prime', sharePct: 37, indexType: 'ללא', changeMonths: 1, yearStep: 10, anchorType: 'פריים', anchor: .0456, margin: 0 }
    ]
  },
  clock3: {
    name: 'שעון 3',
    routes: [
      { kind: 'fixed', sharePct: 35, indexType: 'ללא', yearStep: 5, anchor: .0462 },
      { kind: 'fixed', sharePct: 0, indexType: 'מדד', yearStep: 5, anchor: .0462 },
      { kind: 'variable', sharePct: 0, indexType: 'ללא', changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'variable', sharePct: 0, indexType: 'מדד', changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'prime', sharePct: 65, indexType: 'ללא', changeMonths: 1, yearStep: 10, anchorType: 'פריים', anchor: .0456, margin: 0 }
    ]
  },
  clock4: {
    name: 'שעון 4',
    routes: [
      { kind: 'fixed', sharePct: 17, indexType: 'ללא', yearStep: 5, anchor: .0462 },
      { kind: 'fixed', sharePct: 17, indexType: 'מדד', yearStep: 5, anchor: .0462 },
      { kind: 'variable', sharePct: 30, indexType: 'ללא', changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'variable', sharePct: 15, indexType: 'מדד', changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'prime', sharePct: 21, indexType: 'ללא', changeMonths: 1, yearStep: 10, anchorType: 'פריים', anchor: .0456, margin: 0 }
    ]
  },
  clock5: {
    name: 'שעון 5',
    routes: [
      { kind: 'fixed', sharePct: 33, indexType: 'ללא', yearStep: 5, anchor: .0462 },
      { kind: 'fixed', sharePct: 0, indexType: 'מדד', yearStep: 5, anchor: .0462 },
      { kind: 'variable', sharePct: 0, indexType: 'ללא', changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'variable', sharePct: 0, indexType: 'מדד', changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: .047, margin: 0 },
      { kind: 'prime', sharePct: 67, indexType: 'ללא', changeMonths: 1, yearStep: 10, anchorType: 'פריים', anchor: .0456, margin: 0 }
    ]
  }
};

function cloneClockTemplates(source = CLOCK_TEMPLATES) {
  const copy = JSON.parse(JSON.stringify(source));
  Object.values(copy).forEach(template => template.conditions = Object.assign({ shortenFixed: true, linkedFixedFirst: true }, template.conditions || {}));
  return copy;
}

function activeClockTemplates(mixState) { return mixState?.clockTemplates || CLOCK_TEMPLATES; }

function allowedYears(rt) {
  const kind = inferRouteKind(rt);
  if (kind !== 'variable') {
    const step = Math.max(1, Math.round(num(rt.yearStep) || 1));
    const first = step > 1 ? Math.max(4, step) : 4;
    const out = [];
    for (let years = first; years <= 30; years += step) out.push(years);
    return out;
  }
  const jump = Math.max(1, Math.round((num(rt.yearStep) || num(rt.changeMonths) / 12 || 5) * 12));
  const out = [];
  for (let months = 72; months <= 360; months++) if (months % jump === 0) out.push(months / 12);
  return out.length ? out : [6, 30];
}

function nearestAllowedYears(rt, value) {
  const vals = allowedYears(rt);
  return vals.reduce((best, x) => Math.abs(x - value) < Math.abs(best - value) ? x : best, vals[0]);
}

function candidateYears(rt, t) {
  const values = allowedYears(rt);
  return values[Math.round(t * (values.length - 1))];
}

function syncRouteGeneralRate(rt, ratesCtx) {
  if (!rt.useGeneralRate) return;
  const rate = generalRateForRoute(rt, rt.years, ratesCtx);
  rt.anchor = rate.anchor; rt.margin = rate.margin;
}

function applyRouteKind(rt, kind, ratesCtx) {
  rt.kind = kind;
  rt.board = 'שפיצר';
  rt.balloon = ''; rt.balloonMonths = '';
  if (kind === 'fixed') {
    rt.rateType = 'קבועה'; rt.changeMonths = ''; rt.anchorType = '';
    if (!['ללא', 'מדד'].includes(rt.indexType)) rt.indexType = 'ללא';
    rt.years = Math.min(30, Math.max(4, num(rt.years) || 20));
  } else if (kind === 'variable') {
    rt.rateType = 'משתנה'; rt.anchorType = rt.anchorType === 'פריים' ? '' : rt.anchorType;
    rt.changeMonths = num(rt.changeMonths) || 60;
    if (!['ללא', 'מדד'].includes(rt.indexType)) rt.indexType = 'ללא';
    rt.years = nearestAllowedYears(rt, num(rt.years) || 20);
  } else {
    rt.rateType = 'משתנה'; rt.anchorType = 'פריים'; rt.changeMonths = 1; rt.indexType = 'ללא'; rt.indexPct = 0;
    rt.years = Math.min(30, Math.max(4, num(rt.years) || 20));
  }
  syncRouteGeneralRate(rt, ratesCtx);
}

function buildClockRoute(spec, ratesCtx) {
  const rt = Object.assign(blankRoute(), spec);
  rt.useGeneralRate = true;
  rt.years = allowedYears(rt)[0];
  const general = generalRateForRoute(rt, rt.years, ratesCtx);
  rt.anchor = general.anchor;
  rt.margin = general.margin;
  rt.indexPct = rt.indexType === 'מדד' ? 1 : 0;
  applyRouteKind(rt, rt.kind, ratesCtx);
  return rt;
}

function validateMixTemplate(routes) {
  if (!routes.length) return 'יש להוסיף לפחות מסלול אחד.';
  if (routes.length > 10) return 'תמהיל יכול להכיל עד 10 מסלולים.';
  const share = routes.reduce((s, r) => s + num(r.sharePct), 0);
  if (Math.abs(share - 100) > .01) return `סכום אחוזי המסלולים חייב להיות 100% (כעת ${share.toFixed(2)}%).`;
  for (let i = 0; i < routes.length; i++) {
    const rt = routes[i], kind = inferRouteKind(rt);
    if (kind === 'variable' && num(rt.changeMonths) <= 0) return `במסלול ${i + 1} יש להזין כל כמה חודשים הריבית משתנה.`;
    if (num(rt.anchor) + num(rt.margin) < 0) return `במסלול ${i + 1} הריבית הכוללת שלילית.`;
  }
  return '';
}

function mixSettings(mixState, key) {
  mixState.mixSettings = mixState.mixSettings || {};
  mixState.mixSettings[key] = mixState.mixSettings[key] || {};
  return mixState.mixSettings[key];
}

function applyMixSettingsToRoutes(mixState, ratesCtx, key) {
  const settings = mixSettings(mixState, key), routes = mixState.mixes?.[key] || [];
  const takenToday = !!settings.takenToday;
  routes.forEach(route => {
    route.takenToday = takenToday;
    route.dailyInterest = takenToday;
    route.forceActualIndex = takenToday;
    route.startDateOverride = takenToday ? today() : '';
    if (route.useGeneralRate) syncRouteGeneralRate(route, ratesCtx);
  });
}

function currentMortgageBalance(mixState, params, ratesCtx) {
  return calcMix(mixState.mixes?.current || [], params, ratesCtx).totalAmount;
}

function mixLoanAmount(mixState, params, ratesCtx, key = '') {
  const current = currentMortgageBalance(mixState, params, ratesCtx);
  if (key && key !== 'current' && current > 0) return current;
  const keys = ['current', 't1', 't2', 't3', 't4', 't5'];
  return num(mixState.financial?.loanAmount) || current
    || Math.max(0, ...keys.map(k => calcMix(mixState.mixes[k] || [], params, ratesCtx).E));
}

function calculateCurrentPurposeShares(routes) {
  const totals = { housing: 0, allPurpose: 0 };
  routes.forEach(route => {
    const purpose = route.loanPurpose || 'housing';
    totals[purpose] = (totals[purpose] || 0) + num(route.amount);
  });
  const total = totals.housing + totals.allPurpose;
  return total ? { housing: totals.housing / total, allPurpose: totals.allPurpose / total } : { housing: 1, allPurpose: 0 };
}

function currentPurposeModeFromRoutes(mixState) {
  const routes = mixState.mixes?.current || [];
  const purposes = new Set(routes.map(route => route.loanPurpose).filter(Boolean));
  if (purposes.has('housing') && purposes.has('allPurpose')) return 'mixed';
  if (purposes.has('allPurpose')) return 'allPurpose';
  return mixState.currentMortgagePurpose === 'allPurpose' ? 'allPurpose' : 'housing';
}

function applyCurrentPurposeSplitToRoutes(mixState, routes) {
  const mode = currentPurposeModeFromRoutes(mixState);
  mixState.currentMortgagePurpose = mode;
  mixState.currentPurposeShares = calculateCurrentPurposeShares(mixState.mixes?.current || []);
  const shares = mixState.currentPurposeShares || { housing: 1, allPurpose: 0 };
  routes.forEach(route => {
    if (mode === 'mixed') {
      route.purposeSplit = { housing: num(shares.housing), allPurpose: num(shares.allPurpose) };
      route.loanPurpose = '';
    } else {
      route.purposeSplit = null;
      route.loanPurpose = mode === 'allPurpose' ? 'allPurpose' : 'housing';
    }
  });
}

function templateConditionsForMix(mixState, key) {
  const templateKey = /^t[1-5]$/.test(key) ? 'clock' + key.slice(1) : '';
  return activeClockTemplates(mixState)[templateKey]?.conditions || { shortenFixed: true, linkedFixedFirst: true };
}

function shortenFixedRoutesToMaximum(routes, maxPay, conditions, params, ratesCtx) {
  if (conditions.shortenFixed === false) return [];
  const fixed = routes.map((route, index) => ({ route, index }))
    .filter(item => inferRouteKind(item.route) === 'fixed' && num(item.route.amount) > 0)
    .sort((a, b) => {
      const linkedDifference = Number(b.route.indexType === 'מדד') - Number(a.route.indexType === 'מדד');
      return conditions.linkedFixedFirst === false ? -linkedDifference : linkedDifference;
    });
  const shortened = [];
  fixed.forEach(({ route, index }) => {
    const original = num(route.years);
    const candidates = allowedYears(route).filter(years => years < original).sort((a, b) => a - b);
    let selected = original;
    for (const years of candidates) {
      route.years = years;
      if (calcMix(routes, params, ratesCtx).firstPay <= maxPay + .01) { selected = years; break; }
    }
    route.years = selected;
    if (selected < original) shortened.push({ index, from: original, to: selected, linked: route.indexType === 'מדד' });
  });
  return shortened;
}

/** מחשב שעון בודד כך שההחזר הראשון יתאים לטווח ההחזר המבוקש. */
function calculateMixToRange(mixState, params, ratesCtx, key) {
  const routes = mixState.mixes[key] || [];
  if (/^t[1-5]$/.test(key) && currentMortgageBalance(mixState, params, ratesCtx) > 0) {
    applyCurrentPurposeSplitToRoutes(mixState, routes);
  }
  applyMixSettingsToRoutes(mixState, ratesCtx, key);
  const error = validateMixTemplate(routes);
  const minPay = num(mixState.financial?.minPay), maxPay = num(mixState.financial?.maxPayDesired);
  const loan = mixLoanAmount(mixState, params, ratesCtx, key);
  mixState.mixCalcStatus = mixState.mixCalcStatus || {};
  if (error) { mixState.mixCalcStatus[key] = { ok: false, text: error }; return false; }
  if (loan <= 0) { mixState.mixCalcStatus[key] = { ok: false, text: 'יש להזין סכום משכנתא בנתונים הכלכליים.' }; return false; }
  if (minPay <= 0 || maxPay <= 0 || minPay > maxPay) { mixState.mixCalcStatus[key] = { ok: false, text: 'יש להזין טווח החזר חודשי תקין.' }; return false; }
  routes.forEach(rt => {
    applyRouteKind(rt, inferRouteKind(rt), ratesCtx);
    rt.amount = loan * num(rt.sharePct) / 100;
  });
  const target = (minPay + maxPay) / 2;
  let best = null;
  for (let step = 0; step <= 240; step++) {
    const t = step / 240;
    routes.forEach(rt => rt.years = candidateYears(rt, t));
    const mix = calcMix(routes, params, ratesCtx);
    const inRange = mix.firstPay >= minPay && mix.firstPay <= maxPay;
    const distance = inRange ? Math.abs(mix.firstPay - target) : Math.min(Math.abs(mix.firstPay - minPay), Math.abs(mix.firstPay - maxPay));
    if (!best || Number(inRange) > Number(best.inRange) || (inRange === best.inRange && distance < best.distance)) {
      best = { years: routes.map(r => r.years), mix, inRange, distance };
    }
  }
  best.years.forEach((years, i) => routes[i].years = years);
  for (let round = 0; round < 3; round++) {
    routes.forEach((rt, i) => {
      let localBest = best;
      allowedYears(rt).forEach(years => {
        rt.years = years;
        const mix = calcMix(routes, params, ratesCtx);
        const inRange = mix.firstPay >= minPay && mix.firstPay <= maxPay;
        const distance = inRange ? Math.abs(mix.firstPay - target) : Math.min(Math.abs(mix.firstPay - minPay), Math.abs(mix.firstPay - maxPay));
        if (Number(inRange) > Number(localBest.inRange) || (inRange === localBest.inRange && distance < localBest.distance)) {
          localBest = { years: routes.map(r => r.years), mix, inRange, distance };
        }
      });
      best = localBest;
      best.years.forEach((years, j) => routes[j].years = years);
    });
  }
  best.years.forEach((years, i) => routes[i].years = years);
  const conditions = templateConditionsForMix(mixState, key);
  const shortened = shortenFixedRoutesToMaximum(routes, maxPay, conditions, params, ratesCtx);
  routes.forEach(rt => {
    if (rt.useGeneralRate) {
      const rate = generalRateForRoute(rt, rt.years, ratesCtx);
      rt.anchor = rate.anchor; rt.margin = rate.margin;
    }
  });
  const finalMix = calcMix(routes, params, ratesCtx);
  const finalInRange = finalMix.firstPay >= minPay && finalMix.firstPay <= maxPay;
  const shortenedText = shortened.length
    ? ` תקופת הקבועה קוצרה עד למקסימום האפשרי${conditions.linkedFixedFirst !== false && shortened.some(x => x.linked) ? ' — בעדיפות לקבועה הצמודה' : ''}.`
    : '';
  mixState.mixCalcStatus[key] = finalInRange
    ? { ok: true, text: `נמצא פתרון: החזר ראשון ${fmtMoney(finalMix.firstPay)} בטווח המבוקש.${shortenedText}` }
    : { ok: false, text: `לא נמצא פתרון מלא בטווח. התוצאה הקרובה: ${fmtMoney(finalMix.firstPay)}. ניתן לערוך ריביות, אחוזים או תקופות.` };
  return finalInRange;
}

function loadClockTemplate(mixState, ratesCtx, templateKey = 'clock1', targetKey = 't1') {
  const template = activeClockTemplates(mixState)[templateKey];
  if (!template) return;
  mixState.mixes[targetKey] = template.routes
    .filter(route => num(route.sharePct) > 0)
    .map(route => buildClockRoute(route, ratesCtx));
  applyMixSettingsToRoutes(mixState, ratesCtx, targetKey);
  mixState.mixCalcStatus = mixState.mixCalcStatus || {};
  mixState.mixCalcStatus[targetKey] = { ok: true, text: `תבנית ${template.name} נטענה. האחוזים והמבנה קבועים, וכל השדות עדיין ניתנים לעריכה.` };
}

/** טוען ומחשב שעון בודד (מקביל ל"טען וחשב שעון" בעמוד). */
function applyAndCalculateClock(mixState, params, ratesCtx, templateKey = 'clock1') {
  const targetKey = 't' + templateKey.replace('clock', '');
  loadClockTemplate(mixState, ratesCtx, templateKey, targetKey);
  if (currentMortgageBalance(mixState, params, ratesCtx) > 0) {
    applyCurrentPurposeSplitToRoutes(mixState, mixState.mixes[targetKey]);
  }
  calculateMixToRange(mixState, params, ratesCtx, targetKey);
  return mixState.mixes[targetKey];
}

/** טוען ומחשב את כל חמשת השעונים (מקביל ל"חשב את כל השעונים"). */
function calculateAllMixes(mixState, params, ratesCtx) {
  Object.keys(activeClockTemplates(mixState)).forEach(templateKey => {
    const targetKey = 't' + templateKey.replace('clock', '');
    loadClockTemplate(mixState, ratesCtx, templateKey, targetKey);
    applyCurrentPurposeSplitToRoutes(mixState, mixState.mixes[targetKey]);
    calculateMixToRange(mixState, params, ratesCtx, targetKey);
  });
  return mixState.mixes;
}

module.exports = {
  fmt, fmtMoney, blankRoute, CLOCK_TEMPLATES, cloneClockTemplates, activeClockTemplates,
  allowedYears, nearestAllowedYears, candidateYears, syncRouteGeneralRate, applyRouteKind,
  buildClockRoute, validateMixTemplate, mixSettings, applyMixSettingsToRoutes,
  currentMortgageBalance, mixLoanAmount, calculateCurrentPurposeShares, currentPurposeModeFromRoutes,
  applyCurrentPurposeSplitToRoutes, templateConditionsForMix, shortenFixedRoutesToMaximum,
  calculateMixToRange, loadClockTemplate, applyAndCalculateClock, calculateAllMixes
};
