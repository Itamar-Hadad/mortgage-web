import { test, expect } from 'vitest'
import { calcRoute } from './route'
import type { Params, Route } from './types'

// Golden values in this file were extracted by running the *original*
// calcRoute/calcMix straight out of "project files/סימולטור_משכנתא.html"
// in a real browser (Playwright) — not hand-computed — so any mismatch here
// is a genuine behavior difference from the existing simulator.

const params: Params = { ללא: 0, מדד: 0.03, דולר: 0.03, אירו: 0.015 }

function blank(): Route {
  return {
    kind: 'fixed',
    sharePct: 0,
    amount: 0,
    years: 20,
    board: 'שפיצר',
    balloon: '',
    balloonMonths: 0,
    rateType: 'קבועה',
    changeMonths: 0,
    indexType: 'ללא',
    indexPct: 1,
    anchorType: '',
    anchor: 0,
    margin: 0,
  }
}

test('שפיצר fixed-rate route, no indexation — matches the original simulator', () => {
  const rt: Route = { ...blank(), amount: 580000, years: 20, anchor: 0.0462, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBeCloseTo(3707.0422803803085, 6)
  expect(c.T).toBeCloseTo(889690.147291258, 4)
  expect(c.n).toBe(240)
  expect(c.annualRate).toBeCloseTo(0.0462, 10)
  expect(c.effRate).toBeCloseTo(0.04719094908516763, 10)
})

test('קרן שווה route produces constant principal payments', () => {
  const rt: Route = { ...blank(), board: 'קרן שווה', amount: 600000, years: 20, anchor: 0.05, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBeCloseTo(5000, 6)
  expect(c.T).toBeCloseTo(901250, 4)
  expect(c.prin[1]).toBeCloseTo(2500, 6)
  expect(c.prin[100]).toBeCloseTo(2500, 6)
  expect(c.M[100]).toBeCloseTo(3968.75, 6)
})

test('בלון מלא — no payments until the balloon month, then a single lump sum', () => {
  const rt: Route = { ...blank(), balloon: 'בלון מלא', balloonMonths: 12, amount: 500000, years: 10, anchor: 0.05, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBe(0)
  expect(c.M[1]).toBe(0)
  expect(c.M[6]).toBe(0)
  expect(c.M[12]).toBeCloseTo(500000, 4)
  expect(c.M[13]).toBe(0)
  expect(c.T).toBeCloseTo(525000, 4)
})

test('בלון חלקי — interest-only until the balloon month, then principal + interest lump sum', () => {
  const rt: Route = { ...blank(), balloon: 'בלון חלקי', balloonMonths: 12, amount: 500000, years: 10, anchor: 0.05, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBeCloseTo(2083.3333333333335, 6)
  expect(c.M[1]).toBeCloseTo(2083.3333333333335, 6)
  expect(c.M[12]).toBeCloseTo(502083.3333333333, 4)
  expect(c.M[13]).toBe(0)
})

test('גרייס מלא — zero payments during grace, normal payments after', () => {
  const rt: Route = { ...blank(), balloon: 'גרייס מלא', balloonMonths: 6, amount: 400000, years: 15, anchor: 0.045, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBe(0)
  expect(c.M[6]).toBe(0)
  expect(c.M[7]).toBeCloseTo(3204.513376712342, 4)
  expect(c.M[100]).toBeCloseTo(3204.513376712299, 4)
  expect(c.T).toBeCloseTo(557585.327547937, 2)
})

test('גרייס חלקי — interest-only during grace, normal payments after', () => {
  const rt: Route = { ...blank(), balloon: 'גרייס חלקי', balloonMonths: 6, amount: 400000, years: 15, anchor: 0.045, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBeCloseTo(1500, 6)
  expect(c.M[6]).toBeCloseTo(1500, 6)
  expect(c.M[7]).toBeCloseTo(3133.9984124326083, 4)
  expect(c.T).toBeCloseTo(554315.7237632637, 2)
})

test('מדד-linked route grows the outstanding balance by the annual index', () => {
  const rt: Route = { ...blank(), indexType: 'מדד', indexPct: 1, amount: 500000, years: 20, anchor: 0.04, margin: 0 }
  const c = calcRoute(rt, params)
  expect(c.annualIndex).toBeCloseTo(0.03, 10)
  expect(c.S).toBeCloseTo(3029.9016464970473, 6)
  expect(c.T).toBeCloseTo(994722.7646720523, 2)
  expect(c.L[2]).toBeCloseTo(499883.35693272, 2)
  expect(c.idxPrin[1]).toBeCloseTo(1246.591912550424, 4)
})

test('דולר-linked route uses the דולר expectation from params', () => {
  const rt: Route = { ...blank(), indexType: 'דולר', indexPct: 1, amount: 500000, years: 20, anchor: 0.04, margin: 0 }
  const c = calcRoute(rt, params)
  expect(c.annualIndex).toBeCloseTo(0.03, 10)
  expect(c.T).toBeCloseTo(994722.7646720523, 2)
})

test('אירו-linked route uses the אירו expectation from params', () => {
  const rt: Route = { ...blank(), indexType: 'אירו', indexPct: 1, amount: 500000, years: 20, anchor: 0.04, margin: 0 }
  const c = calcRoute(rt, params)
  expect(c.annualIndex).toBeCloseTo(0.015, 10)
  expect(c.T).toBeCloseTo(847417.2989583687, 2)
})

test('daily interest compounding produces a different (higher) effective rate than monthly', () => {
  const dailyRt: Route = { ...blank(), dailyInterest: true, amount: 500000, years: 20, anchor: 0.04, margin: 0, indexType: '' }
  const monthlyRt: Route = { ...blank(), dailyInterest: false, amount: 500000, years: 20, anchor: 0.04, margin: 0, indexType: '' }
  const daily = calcRoute(dailyRt, params)
  const monthly = calcRoute(monthlyRt, params)
  expect(daily.S).toBeCloseTo(3031.6023750607333, 6)
  expect(monthly.S).toBeCloseTo(3029.9016464970473, 6)
  expect(daily.effRate).toBeGreaterThan(monthly.effRate)
})

test('split-purpose route merges housing/allPurpose parts into one calc', () => {
  const rt: Route = { ...blank(), purposeSplit: { housing: 0.6, allPurpose: 0.4 }, amount: 500000, years: 20, anchor: 0.045, margin: 0, indexType: '' }
  const c = calcRoute(rt, params)
  expect(c.S).toBeCloseTo(3163.246881099854, 6)
  expect(c.T).toBeCloseTo(759179.2514639515, 2)
  expect(c.n).toBe(240)
})