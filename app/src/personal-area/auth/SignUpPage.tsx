import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { ConfirmationResult, UserCredential } from 'firebase/auth'
import {
  createRecaptchaVerifier,
  sendPhoneOtp,
  confirmPhoneOtp,
  signUpWithEmail,
  isNewUser,
  waitForRoleClaim,
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
    if (newUser) await waitForRoleClaim(credential.user)
    await migrateDraftOnSignup(credential.user.uid, newUser)
    navigate('/personal-area')
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const verifier = createRecaptchaVerifier(RECAPTCHA_CONTAINER_ID)
      confirmationRef.current = await sendPhoneOtp(phoneNumber, verifier)
      setPhoneStep('enter-code')
    } catch {
      setError(t('sign_up.error_generic'))
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
    } catch {
      setError(t('sign_up.error_generic'))
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
    } catch {
      setError(t('sign_up.error_generic'))
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
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
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
    </AuthPageShell>
  )
}
