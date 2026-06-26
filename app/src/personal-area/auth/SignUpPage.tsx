import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import type { ConfirmationResult, UserCredential } from 'firebase/auth'
import {
  createRecaptchaVerifier,
  sendPhoneOtp,
  confirmPhoneOtp,
  signUpWithEmail,
  signInWithGoogle,
  isNewUser,
  claimConsumerRole,
  firebaseErrorMessage,
  normaliseIsraeliPhone,
} from './authService'
import { migrateDraftOnSignup } from './migrateDraftOnSignup'
import { AuthPageShell, Icon } from '../../shared/AppLayout'

const RECAPTCHA_CONTAINER_ID = 'sign-up-recaptcha-container'

type Method = 'phone' | 'email'
type PhoneStep = 'enter-phone' | 'enter-code'

export function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [method, setMethod] = useState<Method>('phone')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter-phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const confirmationRef = useRef<ConfirmationResult | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function completeSignup(credential: UserCredential) {
    const newUser = isNewUser(credential)
    await migrateDraftOnSignup(credential.user.uid, newUser)
    // Only grant the consumer role once the draft is safely in requests/{uid} —
    // a cancelled/interrupted signup must never leave a permanently-privileged
    // Auth user with no backing record (issue #5 AC).
    if (newUser) {
      await claimConsumerRole()
      await credential.user.getIdToken(true)
    }
    navigate('/personal-area')
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const e164 = normaliseIsraeliPhone(phoneNumber)
      const verifier = createRecaptchaVerifier(RECAPTCHA_CONTAINER_ID)
      confirmationRef.current = await sendPhoneOtp(e164, verifier)
      setPhoneStep('enter-code')
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!confirmationRef.current) return
    setSubmitting(true)
    try {
      const credential = await confirmPhoneOtp(confirmationRef.current, code)
      await completeSignup(credential)
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const credential = await signUpWithEmail(email, password)
      await completeSignup(credential)
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(112,234,255,0.2)' }}>
          <Icon name="person_add" className="text-3xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          {t('sign_up.title')}
        </h1>
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={async () => {
          setError(null)
          setSubmitting(true)
          try {
            const credential = await signInWithGoogle()
            await completeSignup(credential)
          } catch (err) {
            setError(firebaseErrorMessage(err))
          } finally {
            setSubmitting(false)
          }
        }}
        className="w-full flex items-center justify-center gap-3 font-semibold py-3 rounded-full border mb-4 transition-colors hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface)', background: 'white' }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        {t('sign_up.google')}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
        <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{t('sign_up.or')}</span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
      </div>

      <div role="tablist" className="flex gap-2 mb-6 p-1 rounded-full" style={{ background: 'var(--color-surface-container)' }}>
        <button
          type="button"
          aria-pressed={method === 'phone'}
          onClick={() => setMethod('phone')}
          className="flex-1 py-2 rounded-full font-semibold text-sm transition-colors"
          style={
            method === 'phone'
              ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
              : { color: 'var(--color-on-surface-variant)' }
          }
        >
          {t('sign_up.method_phone')}
        </button>
        <button
          type="button"
          aria-pressed={method === 'email'}
          onClick={() => setMethod('email')}
          className="flex-1 py-2 rounded-full font-semibold text-sm transition-colors"
          style={
            method === 'email'
              ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
              : { color: 'var(--color-on-surface-variant)' }
          }
        >
          {t('sign_up.method_email')}
        </button>
      </div>

      {method === 'phone' && phoneStep === 'enter-phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="phone-number" className="ss-label">{t('sign_up.phone_label')}</label>
            <input
              id="phone-number"
              type="tel"
              className="ss-input"
              placeholder="05X-XXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              ניתן להזין בפורמט ישראלי (052...) — המרה ל-E.164 אוטומטית
            </p>
          </div>
          <div id={RECAPTCHA_CONTAINER_ID} />
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-bold py-3.5 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}
          >
            {t('sign_up.send_code')}
          </button>
        </form>
      )}

      {method === 'phone' && phoneStep === 'enter-code' && (
        <form onSubmit={handleConfirmCode} className="space-y-4">
          <div>
            <label htmlFor="otp-code" className="ss-label">{t('sign_up.code_label')}</label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              className="ss-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-bold py-3.5 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}
          >
            {t('sign_up.confirm_code')}
          </button>
        </form>
      )}

      {method === 'email' && (
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="ss-label">{t('sign_up.email_label')}</label>
            <input
              id="signup-email"
              type="email"
              className="ss-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="ss-label">{t('sign_up.password_label')}</label>
            <input
              id="signup-password"
              type="password"
              className="ss-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-bold py-3.5 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}
          >
            {t('sign_up.submit_email')}
          </button>
        </form>
      )}

      {error && (
        <div
          className="mt-4 px-4 py-3 rounded-lg flex items-center gap-2"
          style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
          role="alert"
        >
          <Icon name="error" filled className="text-xl flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
        {t('sign_up.already_have_account')}{' '}
        <Link to="/sign-in" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
          {t('sign_in.title')}
        </Link>
      </p>
    </AuthPageShell>
  )
}
