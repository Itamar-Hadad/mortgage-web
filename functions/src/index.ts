import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { auth as authTrigger } from 'firebase-functions/v1'
import type { UserRecord } from 'firebase-functions/v1/auth'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { calcMix } from './calc-engine/mix'
import { calcRoute } from './calc-engine/route'
import { mixRisk } from './calc-engine/risk'
import type { Params, Route } from './calc-engine/types'

initializeApp()

// ARCHITECTURE.md §1/§9: role is a Firebase Auth custom claim, not a separate
// permissions table. Every self-service signup in this round is a "משתמש רשום"
// (consumer) — advisor/admin accounts are provisioned out-of-band (issues #8/#11),
// not through this trigger. See issue #5 acceptance criteria.
export async function handleUserCreate(user: UserRecord): Promise<void> {
  await getAuth().setCustomUserClaims(user.uid, { role: 'consumer' })
}

export const assignConsumerRoleOnSignup = authTrigger.user().onCreate(handleUserCreate)

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
