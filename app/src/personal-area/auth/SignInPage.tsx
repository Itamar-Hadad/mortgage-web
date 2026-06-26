import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmail, signInWithGoogle, isNewUser, getUserRole, firebaseErrorMessage } from './authService'
import { migrateDraftOnSignup } from './migrateDraftOnSignup'
import { claimConsumerRole } from './authService'
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

  async function redirectByRole() {
    const role = await getUserRole()
    if (role === 'admin') navigate('/admin')
    else if (role === 'advisor') navigate('/advisor')
    else navigate('/personal-area')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      await redirectByRole()
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
          <Icon name="login" className="text-3xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          {t('sign_in.title')}
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
            if (isNewUser(credential)) {
              await migrateDraftOnSignup(credential.user.uid, true)
              await claimConsumerRole()
              await credential.user.getIdToken(true)
            }
            await redirectByRole()
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
        {t('sign_in.google')}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
        <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{t('sign_in.or')}</span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
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

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
        {t('sign_in.no_account')}{' '}
        <Link to="/sign-up" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
          {t('sign_up.title')}
        </Link>
      </p>
    </AuthPageShell>
  )
}
