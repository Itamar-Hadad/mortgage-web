import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function Icon({
  name,
  filled = false,
  className = '',
  style,
}: {
  name: string
  filled?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

export function AppHeader() {
  const navigate = useNavigate()
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-3"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(188,201,204,0.3)' }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <img src="/logo.png" alt="SimpleSave" style={{ height: 34, width: 'auto' }} />
      </button>
      <Icon name="help_outline" className="text-2xl cursor-pointer transition-colors" style={{ color: 'var(--color-secondary)' } as React.CSSProperties} />
    </header>
  )
}

export function AppFooter() {
  const { t } = useTranslation()
  const links = [t('footer.privacy_policy'), t('footer.terms_of_service'), t('footer.contact')]

  return (
    <footer
      className="relative w-full py-10 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(188,201,204,0.2)', zIndex: 10 }}
    >
      <div className="flex flex-col items-center md:items-start gap-1">
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-secondary)' }}>
          SimpleSave
        </span>
        <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{t('footer.copyright')}</p>
      </div>
      <div className="flex gap-6">
        {links.map((label) => (
          <a key={label} href="#" className="text-sm transition-colors hover:text-primary" style={{ color: 'var(--color-on-surface-variant)' }}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="bg-blob" style={{ top: '-15%', right: '-10%' }} />
      <div className="bg-blob-2" style={{ bottom: '-10%', left: '-10%', animationDelay: '-5s', animationDuration: '35s' }} />
    </div>
  )
}

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <AppHeader />
      <BackgroundBlobs />
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-12" style={{ zIndex: 10 }}>
        <div className="glass-panel w-full max-w-md rounded-xl p-6 md:p-10">{children}</div>
      </main>
      <AppFooter />
    </div>
  )
}

/** Full-width page shell (no centered card) — for screens like the questionnaire or advisor dashboard. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <AppHeader />
      <BackgroundBlobs />
      <main className="relative flex-1 px-4 pt-28 pb-12" style={{ zIndex: 10 }}>{children}</main>
      <AppFooter />
    </div>
  )
}
