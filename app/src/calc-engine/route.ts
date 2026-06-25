import { PMT } from './pmt'
import type { Params, Route, RouteCalc } from './types'

function num(v: unknown): number {
  const n = parseFloat(v as string)
  return isFinite(n) ? n : 0
}

function indexExpect(type: Route['indexType'], params: Params): number {
  if (type === 'מדד') return num(params['מדד'])
  if (type === 'דולר') return num(params['דולר'])
  if (type === 'אירו') return num(params['אירו'])
  return 0
}

function monthKey(dateStr: string, offset = 0): string {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  if (isNaN(d.getTime())) return ''
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 7)
}

function monthlyIndexRate(paymentMonth: number, forceMonthly: boolean, startDate: string, params: Params): number | null {
  if (!forceMonthly && params.indexCalcMode !== 'monthly') return null
  const key = monthKey(startDate || params.financialDate || new Date().toISOString().slice(0, 10), paymentMonth - 1)
  const row = (params.monthlyIndices || []).find((x) => x.month === key)
  return row ? num(row.rate) : 0
}

function routeAnnualIndex(rt: Route, params: Params): number {
  return rt.customAnnualIndex == null ? indexExpect(rt.indexType, params) : num(rt.customAnnualIndex)
}

function displayedAnnualIndex(rt: Route, params: Params): number {
  if (rt.indexType !== 'מדד' || (!rt.forceActualIndex && params.indexCalcMode !== 'monthly')) {
    return routeAnnualIndex(rt, params)
  }
  return (params.monthlyIndices || []).reduce((p, x) => p * (1 + num(x.rate)), 1) - 1
}

function routePurposeParts(rt: Route): { purpose: 'housing' | 'allPurpose'; share: number }[] {
  const split = rt.purposeSplit
  if (!split) return []
  const housing = Math.max(0, num(split.housing))
  const allPurpose = Math.max(0, num(split.allPurpose))
  const total = housing + allPurpose
  if (total <= 0) return []
  const parts: { purpose: 'housing' | 'allPurpose'; share: number }[] = []
  if (housing > 0) parts.push({ purpose: 'housing', share: housing / total })
  if (allPurpose > 0) parts.push({ purpose: 'allPurpose', share: allPurpose / total })
  return parts
}

export function mergeSplitRouteCalcs(parts: { amount: number; calc: RouteCalc }[]): RouteCalc {
  const maxN = parts.reduce((max, part) => Math.max(max, part.calc.n || 0), 0)
  const amount = parts.reduce((sum, part) => sum + num(part.amount), 0)
  const out: RouteCalc = {
    S: 0,
    T: 0,
    n: maxN,
    L: [],
    baseL: [],
    basePrin: [],
    indexBal: [],
    M: [],
    prin: [],
    intr: [],
    idxEff: [],
    idxPrin: [],
    idxIntr: [],
    cum: [],
    annualRate: 0,
    enteredAnnualRate: 0,
    invalidNegativeRate: false,
    effRate: 0,
    annualIndex: 0,
  }
  const arrayFields = ['L', 'baseL', 'basePrin', 'indexBal', 'M', 'prin', 'intr', 'idxEff', 'idxPrin', 'idxIntr', 'cum'] as const
  parts.forEach((part) => {
    const c = part.calc
    const weight = amount > 0 ? num(part.amount) / amount : 0
    out.S += num(c.S)
    out.T += num(c.T)
    out.annualRate += num(c.annualRate) * weight
    out.enteredAnnualRate += num(c.enteredAnnualRate) * weight
    out.effRate += num(c.effRate) * weight
    out.annualIndex += num(c.annualIndex) * weight
    out.invalidNegativeRate = out.invalidNegativeRate || !!c.invalidNegativeRate
    arrayFields.forEach((field) => {
      for (let i = 0; i <= maxN; i++) out[field][i] = num(out[field][i]) + num(c[field]?.[i])
    })
  })
  return out
}

/** route/params in, calc object out — fixed contract, see calc-engine/README.md. No formula change from the original simulator. */
export function calcRoute(rt: Route, params: Params): RouteCalc {
  if (rt.useGeneralRate) {
    throw new Error('useGeneralRate is not supported by this module yet — see calc-engine/README.md (deferred to issue #11)')
  }
  const E = num(rt.amount)
  const Dy = num(rt.years)
  const purposeParts = routePurposeParts(rt)
  if (E > 0 && purposeParts.length > 1 && !rt._purposeSplitBypass) {
    return mergeSplitRouteCalcs(
      purposeParts.map((part) => ({
        amount: E * part.share,
        calc: calcRoute(
          { ...rt, _purposeSplitBypass: true, purposeSplit: null, loanPurpose: part.purpose, amount: E * part.share },
          params,
        ),
      })),
    )
  }
  const n = Math.trunc(Dy * 12)
  const enteredAnnualRate = num(rt.anchor) + num(rt.margin)
  const annualRate = Math.max(0, enteredAnnualRate)
  const monthlyRate = rt.dailyInterest ? Math.pow(1 + annualRate / 365, 365 / 12) - 1 : annualRate / 12
  const out: RouteCalc = {
    S: 0,
    T: 0,
    n,
    L: [],
    baseL: [],
    basePrin: [],
    indexBal: [],
    M: [],
    prin: [],
    intr: [],
    idxEff: [],
    idxPrin: [],
    idxIntr: [],
    cum: [],
    annualRate,
    enteredAnnualRate,
    invalidNegativeRate: enteredAnnualRate < 0,
    effRate: Math.pow(1 + monthlyRate, 12) - 1,
    annualIndex: displayedAnnualIndex(rt, params),
  }
  if (n <= 0 || E <= 0) return out
  const r = monthlyRate
  const F = rt.board || 'שפיצר'
  const G = rt.balloon || ''
  const H = num(rt.balloonMonths)
  const isBalloon = G === 'בלון מלא' || G === 'בלון חלקי'
  const isGrace = G === 'גרייס מלא' || G === 'גרייס חלקי'
  const L = [0],
    B = [0],
    N = [0],
    O = [0],
    P = [0],
    R = [0],
    M = [0]
  let cumM = 0,
    cumO = 0,
    sumR = 0,
    T = 0
  const idxStop = isBalloon ? H : n
  for (let m = 1; m <= n; m++) {
    const actualMonthly = rt.indexType === 'מדד' ? monthlyIndexRate(m, !!rt.forceActualIndex, rt.startDateOverride || '', params) : null
    const idx = (actualMonthly === null ? routeAnnualIndex(rt, params) / 12 : actualMonthly) * num(rt.indexPct)
    if (m === 1) {
      L[m] = Dy * 12 > 1 ? E : 0
      B[m] = L[m]
    } else {
      if (Dy * 12 >= m) {
        if (isBalloon) {
          L[m] = H === m || H + 1 > m ? P[m - 1] : 0
        } else if (G === 'גרייס מלא') {
          L[m] = H + 1 === m ? P[m - 1] + sumR : P[m - 1]
        } else {
          L[m] = P[m - 1]
        }
      } else L[m] = 0
      B[m] = Math.max(0, B[m - 1] - (out.basePrin[m - 1] || 0))
    }
    O[m] = L[m] * r
    if (L[m] > 0) {
      if (isBalloon) N[m] = 0
      else if (isGrace && H >= m) N[m] = 0
      else if (F === 'שפיצר') N[m] = -PMT(r, n - m + 1, L[m]) - O[m]
      else N[m] = L[m] / (n - m + 1)
    } else N[m] = 0
    P[m] = (L[m] - N[m]) * (idx + 1)
    R[m] = O[m] + N[m]
    sumR += R[m]
    if (G === 'בלון מלא') M[m] = H === m ? P[m] : 0
    else if (G === 'בלון חלקי') M[m] = H > m ? O[m] : H === m ? P[m] + O[m] : 0
    else if (G === 'גרייס מלא') M[m] = H >= m ? 0 : F === 'שפיצר' ? -PMT(r, n - m + 1, L[m]) : R[m]
    else if (G === 'גרייס חלקי') M[m] = H >= m ? O[m] : F === 'שפיצר' ? -PMT(r, n - m + 1, L[m]) : R[m]
    else M[m] = R[m]
    cumM += M[m]
    cumO += O[m]
    let q: number
    if (G === 'בלון חלקי') q = H === m ? cumM : 0
    else if (G === 'בלון מלא') q = H === m ? cumM + cumO : 0
    else q = cumM
    if (m === idxStop) T = q
    const idxPrin = (L[m] - N[m]) * idx
    const idxIntr = O[m] * idx
    const basePrin = L[m] > 0 ? N[m] * (B[m] / L[m]) : 0
    out.basePrin[m] = basePrin
    out.baseL[m] = B[m]
    out.indexBal[m] = Math.max(0, L[m] - B[m])
    out.prin[m] = N[m]
    out.intr[m] = O[m]
    out.idxPrin[m] = idxPrin
    out.idxIntr[m] = idxIntr
    out.idxEff[m] = idxPrin + idxIntr
    out.cum[m] = cumM
  }
  out.S = M[1] || 0
  out.T = T
  out.L = L
  out.M = M
  return out
}