import { useNavigate } from 'react-router-dom'
import { signOutUser } from './auth/authService'
import type { SectionKey, Track } from './hooks/usePersonalArea'

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

interface SidebarItem {
  key: SectionKey
  label: string
  icon: string
  visibleForTracks: Track[] | 'all'
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'personal', label: 'פרטים אישיים', icon: 'person', visibleForTracks: 'all' },
  { key: 'mortgage', label: 'נתוני משכנתא', icon: 'account_balance', visibleForTracks: 'all' },
  { key: 'credentials', label: 'כתבי הסמכה', icon: 'description', visibleForTracks: 'all' },
  { key: 'documents', label: 'מסמכים', icon: 'folder_open', visibleForTracks: 'all' },
  { key: 'payment', label: 'תשלום', icon: 'payments', visibleForTracks: ['רכישת תמהיל'] },
  { key: 'messages', label: 'הודעות', icon: 'chat', visibleForTracks: 'all' },
]

interface Props {
  track: Track
  activeSection: SectionKey
  isSectionUnlocked: (s: SectionKey) => boolean
  onSelectSection: (s: SectionKey) => void
  userName?: string
  children: React.ReactNode
}

export function PersonalAreaLayout({ track, activeSection, isSectionUnlocked, onSelectSection, userName, children }: Props) {
  const navigate = useNavigate()
  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) => item.visibleForTracks === 'all' || item.visibleForTracks.includes(track)
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-3"
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(188,201,204,0.3)' }}>
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>
          SimpleSave
        </span>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary-container)' }}>
                <Icon name="person" className="text-base" style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-sm font-semibold hidden md:block" style={{ color: 'var(--color-on-surface)' }}>
                שלום, {userName}
              </span>
            </div>
          )}
          <button
            onClick={async () => { await signOutUser(); navigate('/sign-in') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors hover:bg-red-50"
            style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-error)' }}
            title="התנתקות"
          >
            <Icon name="logout" className="text-base" />
            <span className="hidden md:inline">התנתקות</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-l"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', borderColor: 'rgba(188,201,204,0.3)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-secondary)' }}>
              אזור אישי
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{track}</p>
          </div>

          <nav className="flex-1 p-4 flex flex-col gap-1">
            {visibleItems.map((item) => {
              const unlocked = isSectionUnlocked(item.key)
              const isActive = activeSection === item.key
              return (
                <button
                  key={item.key}
                  disabled={!unlocked}
                  onClick={() => unlocked && onSelectSection(item.key)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-right w-full transition-all"
                  style={{
                    background: isActive ? 'var(--color-primary-container)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : unlocked ? 'var(--color-on-surface)' : 'var(--color-outline)',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    opacity: unlocked ? 1 : 0.5,
                  }}>
                  <Icon name={unlocked ? item.icon : 'lock'} filled={isActive} className="text-xl" />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {unlocked && isActive && (
                    <Icon name="chevron_left" className="text-base mr-auto" />
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-10 py-8 overflow-auto">
          <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <div className="bg-blob" style={{ top: '-15%', right: '-10%' }} />
            <div className="bg-blob-2" style={{ bottom: '-10%', left: '-10%', animationDelay: '-5s' }} />
          </div>
          <div className="relative" style={{ zIndex: 10 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
