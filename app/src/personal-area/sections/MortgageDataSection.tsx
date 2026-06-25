import { useNavigate } from 'react-router-dom'
import type { QuestionnaireDraft } from '../../consumer-flow/questionnaire/types'

function fmt(n: number) {
  return Math.round(n).toLocaleString('he-IL')
}

function Icon({ name, className = '', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

interface Props {
  draft: QuestionnaireDraft
  onComplete: () => void
}

export function MortgageDataSection({ draft, onComplete }: Props) {
  const navigate = useNavigate()
  const mix = draft.mixes[0]
  const loanAmount = Number(draft.propertyValue || 0) - Number(draft.equity || 0)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          נתוני משכנתא
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          סיכום נתוני המשכנתא שלכם על בסיס השאלון
        </p>
      </div>

      <div className="glass-panel rounded-xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <Icon name="account_balance" className="text-2xl" style={{ color: 'var(--color-primary)' }} />
          <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
            נתוני הנכס
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="שווי הנכס" value={`₪${fmt(Number(draft.propertyValue || 0))}`} />
          <Stat label="הון עצמי" value={`₪${fmt(Number(draft.equity || 0))}`} />
          <Stat label="סכום משכנתא" value={`₪${fmt(loanAmount)}`} highlight />
          <Stat label="מקור הנכס" value={draft.propertySource || '—'} />
        </div>
      </div>

      {mix ? (
        <div className="glass-panel rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon name="trending_up" className="text-2xl" style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
                {mix.name}
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: 'var(--color-primary-container)', color: 'var(--color-primary)' }}>
              נבחר
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="החזר חודשי התחלתי" value={`₪${fmt(mix.firstMonthlyPayment)}`} highlight />
            <Stat label="סך תשלומים" value={`₪${fmt(mix.totalPayment)}`} />
            <Stat label="ריבית + הצמדה" value={`₪${fmt(mix.totalInterestAndIndexation)}`} />
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>מסלולים:</p>
            <div className="flex flex-wrap gap-2">
              {mix.routes.map((r, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}>
                  {r.kind === 'prime' ? 'פריים' : r.kind === 'variable' ? 'משתנה' : 'קבועה'} {r.sharePct}% · {r.years} שנים
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-6 mb-5 text-center">
          <Icon name="info" className="text-3xl mb-2" style={{ color: 'var(--color-outline)' }} />
          <p style={{ color: 'var(--color-on-surface-variant)' }}>טרם נבחר תמהיל</p>
          <button onClick={() => navigate('/')}
            className="mt-3 rounded-full font-bold py-2 px-6 text-sm"
            style={{ background: 'var(--color-primary-container)', color: 'var(--color-primary)' }}>
            חזרה לשאלון
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onComplete}
          className="rounded-full font-bold py-3 px-10 transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}>
          אישור והמשך
          <Icon name="arrow_back" className="text-xl mr-2" />
        </button>
        <button onClick={() => navigate('/')}
          className="rounded-full font-bold py-3 px-6 border transition-colors"
          style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}>
          עדכון נתונים
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
      <span className="font-bold text-sm" style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-on-surface)', fontFamily: 'var(--font-headline)' }}>
        {value}
      </span>
    </div>
  )
}
