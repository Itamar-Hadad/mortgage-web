// One-off script to create the first admin user in Firebase Auth.
// There is no self-service or callable path to create an admin (createAdvisorCallable
// requires an existing admin caller), so the first admin must be bootstrapped manually
// by a project owner running this script locally.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json \
//     node scripts/createAdminUser.mjs <email> <password> [firstName] [lastName]
//
// The service account key can be downloaded from:
//   Firebase Console -> Project settings -> Service accounts -> Generate new private key

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const [email, password, firstName, lastName] = process.argv.slice(2)
if (!email || !password) {
  console.error('Usage: node scripts/createAdminUser.mjs <email> <password> [firstName] [lastName]')
  process.exit(1)
}

initializeApp({ credential: applicationDefault() })

const auth = getAuth()

const userRecord = await auth.createUser({
  email,
  password,
  displayName: [firstName, lastName].filter(Boolean).join(' ') || undefined,
})

await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' })

console.log(`Created admin user ${email} (uid: ${userRecord.uid}).`)
console.log('Sign in at /staff-sign-in with this email and password.')
