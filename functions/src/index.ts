import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { auth as authTrigger } from 'firebase-functions/v1'
import type { UserRecord } from 'firebase-functions/v1/auth'

initializeApp()

// ARCHITECTURE.md §1/§9: role is a Firebase Auth custom claim, not a separate
// permissions table. Every self-service signup in this round is a "משתמש רשום"
// (consumer) — advisor/admin accounts are provisioned out-of-band (issues #8/#11),
// not through this trigger. See issue #5 acceptance criteria.
export async function handleUserCreate(user: UserRecord): Promise<void> {
  await getAuth().setCustomUserClaims(user.uid, { role: 'consumer' })
}

export const assignConsumerRoleOnSignup = authTrigger.user().onCreate(handleUserCreate)
