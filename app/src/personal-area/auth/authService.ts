import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAdditionalUserInfo,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../../shared/firebase'

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

// Calls `claimConsumerRoleOnRegistration` (functions/src/index.ts). Deliberately
// invoked by SignUpPage only *after* migrateDraftOnSignup's Firestore write
// succeeds — granting the `role: 'consumer'` claim any earlier (e.g. from an
// auth.user().onCreate trigger) would leave a permanently-privileged Auth user
// behind if the tab closes before migration completes. See issue #5 AC "משתמש
// שנכשל/ביטל הרשמה לא משאיר רישום חלקי".
const claimConsumerRoleCallable = httpsCallable(functions, 'claimConsumerRoleOnRegistration')

export async function claimConsumerRole(): Promise<void> {
  await claimConsumerRoleCallable()
}
