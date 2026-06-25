import type { Route, RouteKind } from './types'

function num(v: unknown): number {
  const n = parseFloat(v as string)
  return isFinite(n) ? n : 0
}

export interface RiskRule {
  routeKind: RouteKind | 'all'
  fromMonths: number
  toMonths: number
  indexed: 'כן' | 'לא' | 'הכול'
  exitPenalty: string
  risk: number
}

export interface MixRiskResult {
  score: number
  level?: number
  label: string
}

export function inferRouteKind(rt: Route): RouteKind {
  if (rt.kind) return rt.kind
  if (rt.anchorType === 'פריים') return 'prime'
  return rt.rateType === 'משתנה' ? 'variable' : 'fixed'
}

export function defaultRiskRules(): RiskRule[] {
  return [
    { routeKind: 'prime', fromMonths: 1, toMonths: 12, indexed: 'לא', exitPenalty: 'נמוך', risk: 1 },
    { routeKind: 'variable', fromMonths: 1, toMonths: 59, indexed: 'לא', exitPenalty: 'בינוני', risk: 2 },
    { routeKind: 'variable', fromMonths: 1, toMonths: 59, indexed: 'כן', exitPenalty: 'בינוני', risk: 3 },
    { routeKind: 'variable', fromMonths: 60, toMonths: 360, indexed: 'לא', exitPenalty: 'גבוה', risk: 3 },
    { routeKind: 'variable', fromMonths: 60, toMonths: 360, indexed: 'כן', exitPenalty: 'גבוה', risk: 4 },
    { routeKind: 'fixed', fromMonths: 48, toMonths: 360, indexed: 'לא', exitPenalty: 'גבוה', risk: 3 },
    { routeKind: 'fixed', fromMonths: 48, toMonths: 360, indexed: 'כן', exitPenalty: 'גבוה', risk: 4 },
  ]
}

export function routeChangePeriod(rt: Route): number {
  const kind = inferRouteKind(rt)
  return kind === 'fixed' ? Math.round(num(rt.years) * 12) : kind === 'prime' ? 1 : Math.round(num(rt.changeMonths) || 60)
}

/** route in, risk rule out — riskRules defaults to defaultRiskRules() but callers may pass their own (e.g. from Firestore admin config, issue #11). */
export function riskRuleForRoute(rt: Route, riskRules: RiskRule[] = defaultRiskRules()): RiskRule {
  const months = routeChangePeriod(rt)
  const indexed = rt.indexType === 'מדד' ? 'כן' : 'לא'
  const kind = inferRouteKind(rt)
  return (
    riskRules.find(
      (rule) => (rule.routeKind === 'all' || rule.routeKind === kind) && months >= num(rule.fromMonths) && months <= num(rule.toMonths) && (rule.indexed === 'הכול' || rule.indexed === indexed),
    ) ||
    riskRules.find((rule) => (rule.routeKind === 'all' || rule.routeKind === kind) && (rule.indexed === 'הכול' || rule.indexed === indexed)) || { risk: 1, exitPenalty: 'נמוך', routeKind: 'all', fromMonths: 0, toMonths: 0, indexed: 'הכול' }
  )
}

/** routes in, weighted risk score out — riskRules defaults to defaultRiskRules() but callers may pass their own. */
export function mixRisk(routes: Route[], riskRules: RiskRule[] = defaultRiskRules()): MixRiskResult {
  const useShares = routes.reduce((sum, rt) => sum + num(rt.sharePct), 0) > 0
  const weight = (rt: Route) => (useShares ? num(rt.sharePct) : num(rt.amount))
  const total = routes.reduce((sum, rt) => sum + weight(rt), 0)
  if (total <= 0) return { score: 0, label: '—' }
  const score = routes.reduce((sum, rt) => sum + weight(rt) * num(riskRuleForRoute(rt, riskRules).risk), 0) / total
  const level = Math.min(5, Math.max(1, Math.round(score)))
  const label = score < 1.75 ? 'נמוכה' : score < 2.75 ? 'בינונית' : score < 3.75 ? 'גבוהה' : 'גבוהה מאוד'
  return { score, level, label }
}