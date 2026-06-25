import { test, expect } from 'vitest'
import { defaultRiskRules, inferRouteKind, mixRisk, riskRuleForRoute, routeChangePeriod } from './risk'
import type { Route } from './types'

// Golden values extracted from the original defaultRiskRules/mixRisk/
// riskRuleForRoute in "project files/סימולטור_משכנתא.html" via Playwright.

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

test('defaultRiskRules matches the original simulator table exactly', () => {
  expect(defaultRiskRules()).toEqual([
    { routeKind: 'prime', fromMonths: 1, toMonths: 12, indexed: 'לא', exitPenalty: 'נמוך', risk: 1 },
    { routeKind: 'variable', fromMonths: 1, toMonths: 59, indexed: 'לא', exitPenalty: 'בינוני', risk: 2 },
    { routeKind: 'variable', fromMonths: 1, toMonths: 59, indexed: 'כן', exitPenalty: 'בינוני', risk: 3 },
    { routeKind: 'variable', fromMonths: 60, toMonths: 360, indexed: 'לא', exitPenalty: 'גבוה', risk: 3 },
    { routeKind: 'variable', fromMonths: 60, toMonths: 360, indexed: 'כן', exitPenalty: 'גבוה', risk: 4 },
    { routeKind: 'fixed', fromMonths: 48, toMonths: 360, indexed: 'לא', exitPenalty: 'גבוה', risk: 3 },
    { routeKind: 'fixed', fromMonths: 48, toMonths: 360, indexed: 'כן', exitPenalty: 'גבוה', risk: 4 },
  ])
})

test('riskRuleForRoute classifies each route in t1 like the original simulator', () => {
  expect(routeChangePeriod(t1[0])).toBe(240)
  expect(inferRouteKind(t1[0])).toBe('fixed')
  expect(riskRuleForRoute(t1[0]).risk).toBe(3)

  expect(routeChangePeriod(t1[1])).toBe(60)
  expect(riskRuleForRoute(t1[1]).risk).toBe(3)

  expect(routeChangePeriod(t1[2])).toBe(1)
  expect(inferRouteKind(t1[2])).toBe('prime')
  expect(riskRuleForRoute(t1[2]).risk).toBe(1)
})

test('mixRisk weights route risk by sharePct, matching the original simulator', () => {
  expect(mixRisk(t1)).toEqual({ score: 2.44, level: 2, label: 'בינונית' })
  expect(mixRisk(t2)).toEqual({ score: 2.58, level: 3, label: 'בינונית' })
  expect(mixRisk(t3)).toEqual({ score: 2.3, level: 2, label: 'בינונית' })
})

test('mixRisk of an empty mix is a dash, not a crash', () => {
  expect(mixRisk([])).toEqual({ score: 0, label: '—' })
})