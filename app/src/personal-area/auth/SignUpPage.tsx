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
    <div>
      <h1>{t('sign_up.title')}</h1>

      <div role="tablist">
        <button
          type="button"
          aria-pressed={method === 'phone'}
          onClick={() => setMethod('phone')}
        >
          {t('sign_up.method_phone')}
        </button>
        <button
          type="button"
          aria-pressed={method === 'email'}
          onClick={() => setMethod('email')}
        >
          {t('sign_up.method_email')}
        </button>
      </div>

      {method === 'phone' && phoneStep === 'enter-phone' && (
        <form onSubmit={handleSendCode}>
          <label htmlFor="phone-number">{t('sign_up.phone_label')}</label>
          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <div id={RECAPTCHA_CONTAINER_ID} />
          <button type="submit" disabled={submitting}>
            {t('sign_up.send_code')}
          </button>
        </form>
      )}

      {method === 'phone' && phoneStep === 'enter-code' && (
        <form onSubmit={handleConfirmCode}>
          <label htmlFor="otp-code">{t('sign_up.code_label')}</label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {t('sign_up.confirm_code')}
          </button>
        </form>
      )}

      {method === 'email' && (
        <form onSubmit={handleEmailSignUp}>
          <label htmlFor="signup-email">{t('sign_up.email_label')}</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="signup-password">{t('sign_up.password_label')}</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {t('sign_up.submit_email')}
          </button>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  )
}
