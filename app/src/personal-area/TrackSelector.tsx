import type { Track } from './hooks/usePersonalArea'

function Icon({ name, className = '', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontVariationSettings: "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

const TRACKS: Array<{ value: Track; icon: string; desc: string }> = [
  { value: 'רכישת תמהיל', icon: 'shopping_cart', desc: 'רכשו את תמהיל המשכנתא ואת כתבי ההסמכה הנדרשים לבנק' },
  { value: 'ליווי אינטרנטי', icon: 'computer', desc: 'קבלו ליווי דיגיטלי מלא לאורך כל תהליך אישור המשכנתא' },
  { value: 'יועץ אישי', icon: 'person', desc: 'פגשו יועץ אישי שילווה אתכם אישית לאורך כל הדרך' },
]

interface Props {
  onSelect: (track: Track) => void
}

export function TrackSelector({ onSelect }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--color-background)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="bg-blob" style={{ top: '-15%', right: '-10%' }} />
        <div className="bg-blob-2" style={{ bottom: '-10%', left: '-10%', animationDelay: '-5s' }} />
      </div>

      <div className="relative w-full max-w-2xl" style={{ zIndex: 10 }}>
        <div className="text-center mb-10">
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>
            SimpleSave
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-3"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
            בחרו את המסלול שלכם
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)' }}>
            כיצד תרצו להתקדם עם המשכנתא שלכם?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {TRACKS.map((t) => (
            <button
              key={t.value}
              onClick={() => onSelect(t.value)}
              className="option-card rounded-xl p-6 flex items-center gap-5 text-right w-full transition-all hover:brightness-105 active:scale-98"
              style={{ cursor: 'pointer' }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(112,234,255,0.2)' }}>
                <Icon name={t.icon} className="text-3xl" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
                  {t.value}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {t.desc}
                </p>
              </div>
              <Icon name="arrow_back" className="text-2xl flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
