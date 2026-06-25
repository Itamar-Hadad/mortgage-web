// Payment screen is a visual stub only — ADR-0003.
// No Cloud Function, no Firestore write, no PayPlus integration in hackathon scope.

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

interface Props {
  onComplete: () => void
  done: boolean
}

export function PaymentSection({ onComplete, done }: Props) {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          תשלום
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          תשלום עבור שירות רכישת התמהיל וכתבי ההסמכה
        </p>
      </div>

      {done ? (
        <div className="glass-panel rounded-xl p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Icon name="check_circle" filled className="text-4xl" style={{ color: '#22c55e' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
            התשלום בוצע בהצלחה!
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            הצוות שלנו יצור אתכם קשר להמשך התהליך
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="payments" className="text-2xl" style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
              סיכום הזמנה
            </h3>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>תמהיל משכנתא מותאם אישית</span>
              <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>₪490</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>כתבי הסמכה לבנק</span>
              <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>₪310</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>סה"כ לתשלום</span>
              <span className="font-bold text-xl" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-headline)' }}>₪800</span>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'var(--color-surface-container-low)' }}>
            <Icon name="lock" filled className="text-xl flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
            <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
              התשלום מאובטח ומוצפן. אנו משתמשים ב-SSL 256-bit להגנה על הנתונים שלכם.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full rounded-full font-bold py-4 text-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}>
            המשך לתשלום
            <Icon name="arrow_back" className="text-xl mr-2" />
          </button>
        </div>
      )}
    </div>
  )
}
