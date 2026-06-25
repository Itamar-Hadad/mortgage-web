import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail } from './authService'

// Email+password sign-in for a returning "משתמש רשום" (issue #5 acceptance
// criteria: a returning user is identified as a separate "sign in", never
// re-running migrateDraftOnSignup). The phone returning-user path is handled
// inside SignUpPage itself, since signInWithPhoneNumber is the same call for a
// brand-new and a returning phone number — isNewUser tells them apart there.
export function SignInPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      navigate('/personal-area')
    } catch {
      setError(t('sign_in.error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1>{t('sign_in.title')}</h1>
      <form onSubmit={handleSignIn}>
        <label htmlFor="sign-in-email">{t('sign_in.email_label')}</label>
        <input
          id="sign-in-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="sign-in-password">{t('sign_in.password_label')}</label>
        <input
          id="sign-in-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {t('sign_in.submit')}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
