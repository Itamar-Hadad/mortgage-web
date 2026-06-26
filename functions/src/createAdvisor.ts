import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

interface CreateAdvisorInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

// Admin-only (issue #11): advisor accounts are provisioned by an admin, not
// self-service — see functions/src/index.ts's claimConsumerRole for why
// consumer signup is the only self-service role-claim path.
export async function createAdvisor(request: CallableRequest): Promise<{ uid: string }> {
  if (!request.auth) throw new HttpsError('unauthenticated', 'יש להתחבר לפני יצירת יועץ.')
  if (request.auth.token['role'] !== 'admin') {
    throw new HttpsError('permission-denied', 'רק מנהלים יכולים ליצור יועצים.')
  }

  const { firstName, lastName, email, password } = request.data as CreateAdvisorInput
  if (!firstName || !lastName || !email || !password) {
    throw new HttpsError('invalid-argument', 'יש למלא שם פרטי, שם משפחה, אימייל וסיסמה.')
  }

  const userRecord = await getAuth().createUser({ email, password })
  await getAuth().setCustomUserClaims(userRecord.uid, { role: 'advisor' })

  await getFirestore().doc(`advisors/${userRecord.uid}`).set({
    uid: userRecord.uid,
    firstName,
    lastName,
    email,
    createdAt: new Date().toISOString(),
  })

  return { uid: userRecord.uid }
}

export const createAdvisorCallable = onCall(createAdvisor)