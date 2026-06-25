import { test, expect } from 'vitest'
import { calcMix } from './mix'
import type { Params, Route } from './types'

// Golden values extracted by running the original exampleState() + calcMix
// straight out of "project files/סימולטור_משכנתא.html" in a real browser
// (Playwright) — this is the golden-value test issue #3 requires. Any
// mismatch here is a genuine behavior difference from the existing
// simulator, not an acceptable diff.

const params: Params = { ללא: 0, מדד: 0.03, דולר: 0.03, אירו: 0.015 }

function route(amount: number, years: number, anchor: number, extra: Partial<Route> = {}): Route {
  return {
    kind: 'fixed',
    sharePct: 0,
    years,
    amount,
    board: 'שפיצר',
    balloon: '',
    balloonMonths: 0,
    rateType: 'קבועה',
    changeMonths: 0,
    indexType: '',
    indexPct: 1,
    anchorType: '',
    anchor,
    margin: 0,
    ...extra,
  }
}

const t1: Route[] = [
  route(580000, 20, 0.0462, { kind: 'fixed', sharePct: 34, rateType: 'קבועה' }),
  route(650000, 30, 0.047, { kind: 'variable', sharePct: 38, rateType: 'משתנה', changeMonths: 60 }),
  route(470000, 27, 0.0456, { kind: 'prime', sharePct: 28, rateType: 'משתנה', anchorType: 'פריים', changeMonths: 1, indexType: 'ללא' }),
]
const t2: Route[] = [
  route(850000, 24, 0.047, { kind: 'fixed', sharePct: 50, rateType: 'קבועה' }),
  route(500000, 30, 0.047, { kind: 'variable', sharePct: 29, rateType: 'משתנה', changeMonths: 60 }),
  route(350000, 27, 0.0477, { kind: 'prime', sharePct: 21, anchorType: 'פריים', rateType: 'משתנה', changeMonths: 1, indexType: 'ללא' }),
]
const t3: Route[] = [
  route(1100000, 25, 0.047, { kind: 'fixed', sharePct: 65, rateType: 'קבועה' }),
  route(600000, 30, 0.047, { kind: 'prime', sharePct: 35, anchorType: 'פריים', rateType: 'משתנה', changeMonths: 1, indexType: 'ללא' }),
]

test('exampleState() t1 mix matches the original simulator', () => {
  const mix = calcMix(t1, params)
  expect(mix.E).toBeCloseTo(1700000, 4)
  expect(mix.avgYears).toBeCloseTo(25.758823529411764, 6)
  expect(mix.avgRate).toBeCloseTo(0.04634, 8)
  expect(mix.firstPay).toBeCloseTo(9603.012327983832, 4)
  expect(mix.total).toBeCloseTo(2921345.690123585, 1)
  expect(mix.interest).toBeCloseTo(1221345.6901235834, 1)
  expect(mix.indexation).toBeCloseTo(0, 6)
  expect(mix.maxN).toBe(360)
  expect(mix.per[0].S).toBeCloseTo(3707.0422803803085, 6)
  expect(mix.per[1].n).toBe(360)
  expect(mix.per[2].T).toBeCloseTo(818043.0687443365, 2)
})

test('exampleState() t2 mix matches the original simulator', () => {
  const mix = calcMix(t2, params)
  expect(mix.E).toBeCloseTo(1700000, 4)
  expect(mix.avgYears).toBeCloseTo(26.38235294117647, 6)
  expect(mix.avgRate).toBeCloseTo(0.04714411764705882, 8)
  expect(mix.firstPay).toBeCloseTo(9443.952261717784, 4)
  expect(mix.total).toBeCloseTo(2975799.0708116707, 1)
  expect(mix.interest).toBeCloseTo(1275799.070811673, 1)
  expect(mix.indexation).toBe(0)
  expect(mix.maxN).toBe(360)
  expect(mix.per[0].n).toBe(288)
})

test('exampleState() t3 mix matches the original simulator', () => {
  const mix = calcMix(t3, params)
  expect(mix.E).toBeCloseTo(1700000, 4)
  expect(mix.avgYears).toBeCloseTo(26.764705882352942, 6)
  expect(mix.avgRate).toBeCloseTo(0.047, 8)
  expect(mix.firstPay).toBeCloseTo(9351.524858125555, 4)
  expect(mix.total).toBeCloseTo(2992167.068835771, 1)
  expect(mix.interest).toBeCloseTo(1292167.0688357675, 1)
  expect(mix.indexation).toBeCloseTo(0, 6)
  expect(mix.maxN).toBe(360)
  expect(mix.per[0].S).toBeCloseTo(6239.698001489634, 4)
})