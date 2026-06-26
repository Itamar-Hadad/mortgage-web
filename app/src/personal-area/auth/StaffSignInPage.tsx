import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail, signInWithGoogle, isNewUser, getUserRole, firebaseErrorMessage } from './authService'
import { AuthPageShell, Icon } from '../../shared/AppLayout'

type StaffRole = 'admin' | 'advisor'

const ROLES: { id: StaffRole; label: string; sub: string; icon: string }[] = [
  { id: 'admin',   label: 'מנהל',  sub: 'גישה לכל הבקשות, משימות וניהול צוות', icon: 'admin_panel_settings' },
  { id: 'advisor', label: 'יועץ',  sub: 'ניהול לקוחות, מסמכים ותהליך אישור',   icon: 'support_agent' },
]

export function StaffSignInPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [error,        setError]        = useState<string | null>(null)
  const [submitting,   setSubmitting]   = useState(false)

  /* After successful auth — try Firebase custom claim first, fall back to selection */
  async function redirectAfterAuth(fallbackRole: StaffRole) {
    const claimRole = await getUserRole()
    if      (claimRole === 'admin')   navigate('/admin')
    else if (claimRole === 'advisor') navigate('/advisor')
    else if (fallbackRole === 'admin')  navigate('/admin')
    else                               navigate('/advisor')
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRole) return
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      await redirectAfterAuth(selectedRole)
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    if (!selectedRole) return
    setError(null)
    setSubmitting(true)
    try {
      const credential = await signInWithGoogle()
      if (isNewUser(credential)) {
        // new Google sign-in for staff — just proceed, no consumer migration
      }
      await redirectAfterAuth(selectedRole)
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(112,234,255,0.15)' }}>
          <Icon name="badge" className="text-3xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          כניסת צוות
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
          בחרו את תפקידכם והיכנסו למערכת
        </p>
      </div>

      {/* Step 1 — Role selector */}
      <div className="mb-6">
        <p className="text-xs font-semibold mb-3 text-right" style={{ color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em' }}>
          מה התפקיד שלכם?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {ROLES.map(role => {
            const active = selectedRole === role.id
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                  padding: '1.6rem 1rem',
                  borderRadius: '1.25rem',
                  border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: active ? 'rgba(0,153,187,0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: active ? '0 0 0 3px rgba(0,153,187,0.18)' : 'none',
                }}
              >
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'var(--color-primary)' : 'rgba(0,153,187,0.1)',
                  transition: 'background 0.18s',
                }}>
                  <Icon name={role.icon} filled className="text-3xl"
                    style={{ color: active ? '#fff' : 'var(--color-primary)' } as React.CSSProperties} />
                </div>
                <span className="font-bold text-base" style={{ color: 'var(--color-on-surface)' }}>{role.label}</span>
                <span className="text-xs text-center leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {role.sub}
                </span>
                {active && (
                  <Icon name="check_circle" filled className="text-lg"
                    style={{ color: 'var(--color-primary)', marginTop: 2 } as React.CSSProperties} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 2 — Sign-in form (shown only after role is picked) */}
      {selectedRole && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
              כניסה כ{selectedRole === 'admin' ? 'מנהל' : 'יועץ'}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
          </div>

          {/* Google */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
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
            כניסה עם Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
            <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>או</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
          </div>

          {/* Email + password */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="staff-email" className="ss-label">אימייל</label>
              <input id="staff-email" type="email" className="ss-input"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="staff-password" className="ss-label">סיסמה</label>
              <input id="staff-password" type="password" className="ss-input"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}
            >
              {submitting ? 'מתחבר…' : `כניסה כ${selectedRole === 'admin' ? 'מנהל' : 'יועץ'}`}
            </button>
          </form>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg flex items-center gap-2"
          style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
          role="alert">
          <Icon name="error" filled className="text-xl flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Back to customer login */}
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
        לא איש צוות?{' '}
        <a href="/sign-in" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
          כניסת לקוחות
        </a>
      </p>
    </AuthPageShell>
  )
}
