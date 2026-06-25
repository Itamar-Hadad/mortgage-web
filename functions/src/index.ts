import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { calcMix } from './calc-engine/mix'
import { calcRoute } from './calc-engine/route'
import { mixRisk } from './calc-engine/risk'
import type { Params, Route } from './calc-engine/types'

function requireParams(data: unknown): Params {
  if (!data || typeof data !== 'object') throw new HttpsError('invalid-argument', 'מצופה params בגוף הבקשה.')
  const params = (data as { params?: Params }).params
  return params || {}
}

/** route/params in, calc object out — same module the admin/advisor screens import directly client-side. */
export const calcRouteCallable = onCall((request) => {
  const route = (request.data as { route?: Route } | undefined)?.route
  if (!route || typeof route !== 'object') throw new HttpsError('invalid-argument', 'מצופה route בגוף הבקשה.')
  return calcRoute(route, requireParams(request.data))
})

/** routes/params in, mix object out. */
export const calcMixCallable = onCall((request) => {
  const routes = (request.data as { routes?: Route[] } | undefined)?.routes
  if (!Array.isArray(routes)) throw new HttpsError('invalid-argument', 'מצופה מערך routes בגוף הבקשה.')
  return calcMix(routes, requireParams(request.data))
})

/** routes in, weighted risk score out. */
export const mixRiskCallable = onCall((request) => {
  const routes = (request.data as { routes?: Route[] } | undefined)?.routes
  if (!Array.isArray(routes)) throw new HttpsError('invalid-argument', 'מצופה מערך routes בגוף הבקשה.')
  return mixRisk(routes)
})