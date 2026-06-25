import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail } from './authService'
import { AuthPageShell, Icon } from '../../shared/AppLayout'

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
    <AuthPageShell>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(112,234,255,0.2)' }}>
          <Icon name="login" className="text-3xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          {t('sign_in.title')}
        </h1>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="sign-in-email" className="ss-label">{t('sign_in.email_label')}</label>
          <input
            id="sign-in-email"
            type="email"
            className="ss-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="sign-in-password" className="ss-label">{t('sign_in.password_label')}</label>
          <input
            id="sign-in-password"
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
          className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}
        >
          {t('sign_in.submit')}
        </button>
      </form>

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
