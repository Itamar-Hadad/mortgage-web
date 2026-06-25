import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAdditionalUserInfo,
  type ConfirmationResult,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from '../../shared/firebase'

// ARCHITECTURE.md §11: phone OTP (Firebase Phone Auth) is primary, email+password
// is the alternative. Both produce a real Firebase Auth uid — never Anonymous Auth
// (ADR-0001).

export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
}

export function sendPhoneOtp(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

export function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<UserCredential> {
  return confirmationResult.confirm(code)
}

export function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

// `getAdditionalUserInfo(credential).isNewUser` is how we tell a brand-new signup
// apart from a returning user re-entering — both phone confirm and email
// createUser populate it. See CONTEXT.md "כניסת משתמש רשום" — a returning
// sign-in must never re-run the draft migration in migrateDraftOnSignup.ts.
export function isNewUser(credential: UserCredential): boolean {
  return getAdditionalUserInfo(credential)?.isNewUser ?? false
}

const ROLE_CLAIM_POLL_ATTEMPTS = 5
const ROLE_CLAIM_POLL_DELAY_MS = 500

// `assignConsumerRoleOnSignup` (functions/src/index.ts) sets the `role` custom
// claim asynchronously after the Auth user is created, so it isn't on the token
// we get back from signup. Poll a few times with a forced refresh so the rest of
// the app (and Firestore rules, once issue #7 lands) sees the claim quickly.
export async function waitForRoleClaim(user: User): Promise<string | undefined> {
  for (let attempt = 0; attempt < ROLE_CLAIM_POLL_ATTEMPTS; attempt++) {
    const tokenResult = await user.getIdTokenResult(true)
    const role = tokenResult.claims.role
    if (typeof role === 'string') return role
    await new Promise((resolve) => setTimeout(resolve, ROLE_CLAIM_POLL_DELAY_MS))
  }
  return undefined
}
