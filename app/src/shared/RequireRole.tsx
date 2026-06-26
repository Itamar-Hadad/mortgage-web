import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from './firebase'

type AllowedRole = 'admin' | 'advisor' | 'consumer'

interface Props {
  /** The minimum role required. 'admin' can also access 'advisor' routes. */
  role: AllowedRole
  children: ReactNode
}

/**
 * Route guard — reads the Firebase ID token claim `role` and redirects to
 * /staff-sign-in if the user is unauthenticated or lacks the required role.
 *
 * Renders nothing (spinner) while the async token check is in flight so we
 * never flash the protected screen to an unauthorised visitor.
 */
export function RequireRole({ role, children }: Props) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking')

  useEffect(() => {
    const user = auth.currentUser
    if (!user) { setStatus('denied'); return }

    user.getIdTokenResult(/* forceRefresh */ false)
      .then((result) => {
        const claimRole = result.claims['role'] as string | undefined
        const allowed =
          claimRole === role ||
          // admin can access advisor routes too
          (role === 'advisor' && claimRole === 'admin')
        setStatus(allowed ? 'ok' : 'denied')
      })
      .catch(() => setStatus('denied'))
  }, [role])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-background)' }}>
        <span className="material-symbols-outlined text-5xl animate-spin"
          style={{ color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/staff-sign-in" replace />
  }

  return <>{children}</>
}
