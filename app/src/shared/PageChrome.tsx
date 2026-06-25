// Shared page shell (header/footer/background blobs) — extracted from the
// questionnaire (issue #4) so every screen shares the same chrome.
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
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-3"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(188,201,204,0.3)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>
          SimpleSave
        </span>
      </div>
      <Icon
        name="help_outline"
        className="text-2xl cursor-pointer transition-colors"
        style={{ color: 'var(--color-secondary)' } as React.CSSProperties}
      />
    </header>
  )
}

export function AppFooter() {
  return (
    <footer
      className="relative w-full py-10 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(188,201,204,0.2)', zIndex: 10 }}
    >
      <div className="flex flex-col items-center md:items-start gap-1">
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-secondary)' }}>
          SimpleSave
        </span>
        <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>© 2024 SimpleSave Financial. All rights reserved.</p>
      </div>
      <div className="flex gap-6">
        {['מדיניות פרטיות', 'תנאי שימוש', 'צור קשר'].map((label) => (
          <a
            key={label}
            href="#"
            className="text-sm transition-colors hover:text-primary"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}

export function PageBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="bg-blob" style={{ top: '-15%', right: '-10%' }} />
      <div className="bg-blob-2" style={{ bottom: '-10%', left: '-10%', animationDelay: '-5s', animationDuration: '35s' }} />
    </div>
  )
}

/** Full page shell matching the questionnaire (#4): header, background blobs, footer, content slot. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <AppHeader />
      <PageBackground />
      <main className="relative flex-1 px-4 pt-28 pb-12" style={{ zIndex: 10 }}>
        {children}
      </main>
      <AppFooter />
    </div>
  )
}