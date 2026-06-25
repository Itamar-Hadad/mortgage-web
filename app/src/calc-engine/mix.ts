import { calcRoute } from './route'
import type { MixCalc, Params, Route } from './types'

function num(v: unknown): number {
  const n = parseFloat(v as string)
  return isFinite(n) ? n : 0
}

/** routes/params in, mix object out — fixed contract, see calc-engine/README.md. No formula change from the original simulator. */
export function calcMix(routes: Route[], params: Params): MixCalc {
  let E = 0,
    wYears = 0,
    wRate = 0,
    S = 0,
    T = 0,
    maxN = 0,
    totalInterest = 0,
    exitFee = 0
  const per = routes.map((rt) => {
    const c = calcRoute(rt, params)
    const e = num(rt.amount)
    E += e
    wYears += e * num(rt.years)
    wRate += e * c.annualRate
    S += c.S
    T += c.T
    exitFee += num(rt.exitFee)
    totalInterest += c.intr.reduce((sum, value) => sum + num(value), 0)
    if (c.n > maxN) maxN = c.n
    return c
  })
  const indexation = Math.max(0, T - E - totalInterest)
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
    maxN,
  }
}