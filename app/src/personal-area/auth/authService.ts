import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../../shared/firebase'

const googleProvider = new GoogleAuthProvider()

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

export function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider)
}

export function signOutUser(): Promise<void> {
  return signOut(auth)
}

// `getAdditionalUserInfo(credential).isNewUser` is how we tell a brand-new signup
// apart from a returning user re-entering — both phone confirm and email
// createUser populate it. See CONTEXT.md "כניסת משתמש רשום" — a returning
// sign-in must never re-run the draft migration in migrateDraftOnSignup.ts.
export function isNewUser(credential: UserCredential): boolean {
  return getAdditionalUserInfo(credential)?.isNewUser ?? false
}

/** Maps a Firebase Auth error code to a human-readable Hebrew message. */
export function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/operation-not-allowed':   'שיטת ההתחברות הזו לא מופעלת. פנו למנהל המערכת.',
    'auth/user-not-found':          'המשתמש לא נמצא. בדקו את כתובת המייל.',
    'auth/wrong-password':          'סיסמה שגויה. נסו שנית.',
    'auth/invalid-credential':      'פרטי ההתחברות שגויים. בדקו מייל וסיסמה.',
    'auth/email-already-in-use':    'כתובת המייל הזו כבר רשומה. נסו להתחבר.',
    'auth/weak-password':           'הסיסמה חלשה מדי — לפחות 6 תווים.',
    'auth/invalid-email':           'כתובת מייל לא תקינה.',
    'auth/invalid-phone-number':    'מספר הטלפון לא תקין. השתמשו בפורמט +972XXXXXXXXX.',
    'auth/invalid-verification-code': 'קוד האימות שגוי. נסו שוב.',
    'auth/code-expired':            'קוד האימות פג תוקף. שלחו קוד חדש.',
    'auth/too-many-requests':       'יותר מדי ניסיונות — נסו שוב בעוד מספר דקות.',
    'auth/network-request-failed':  'שגיאת רשת — בדקו את החיבור לאינטרנט.',
    'auth/popup-closed-by-user':    'החלון נסגר לפני השלמת ההתחברות. נסו שוב.',
    'auth/popup-blocked':           'הדפדפן חסם את החלון. אפשרו פתיחת חלונות קופצים עבור אתר זה.',
    'auth/cancelled-popup-request': 'נפתח יותר מחלון אחד. רעננו את הדף ונסו שוב.',
    'auth/unauthorized-domain':     'הדומיין הנוכחי לא מורשה. פנו למנהל המערכת.',
    'auth/quota-exceeded':          'חריגה ממכסת ה-SMS. נסו שוב מאוחר יותר.',
    'auth/missing-phone-number':    'לא הוזן מספר טלפון.',
    'auth/captcha-check-failed':    'אימות CAPTCHA נכשל. רעננו את הדף ונסו שוב.',
  }
  return map[code] ?? 'אירעה שגיאה — נסו שוב.'
}

/** Normalises an Israeli phone number to E.164 format (+972...). */
export function normaliseIsraeliPhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '')
  if (digits.startsWith('+')) return digits          // already E.164
  if (digits.startsWith('972')) return '+' + digits  // without leading +
  if (digits.startsWith('0')) return '+972' + digits.slice(1)
  return digits
}

/** Returns the Firebase custom-claim role for the currently signed-in user. */
export async function getUserRole(): Promise<'admin' | 'advisor' | 'consumer' | null> {
  const user = auth.currentUser
  if (!user) return null
  const result = await user.getIdTokenResult(/* forceRefresh */ false)
  const role = result.claims['role']
  if (role === 'admin' || role === 'advisor' || role === 'consumer') return role
  return null
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
