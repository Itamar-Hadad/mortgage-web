import { useState } from 'react'

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

const DOC_TEXT = `כתב הסמכה למשכנתא

אני הח"מ, מסמיך/ה בזאת את חברת SimpleSave לפעול בשמי מול הגורמים הבנקאיים
לצורך קבלת אישור עקרוני למשכנתא בהתאם לנתונים שמסרתי.

ידוע לי כי:
• SimpleSave אינה גוף בנקאי ואינה נותנת אשראי.
• הנתונים שמסרתי ישמשו לצורך בדיקת זכאות בלבד.
• אני רשאי/ת לבטל הסמכה זו בכל עת בפנייה בכתב.

גרסת המסמך: 1.0
תאריך: ${new Date().toLocaleDateString('he-IL')}`

interface Props {
  onSign: () => Promise<void>
  loading: boolean
  error: string
  done: boolean
}

export function CredentialsSection({ onSign, loading, error, done }: Props) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          כתבי הסמכה
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          קראו ואשרו את כתב ההסמכה להמשך התהליך
        </p>
      </div>

      {done ? (
        <div className="glass-panel rounded-xl p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Icon name="check_circle" filled className="text-4xl" style={{ color: '#22c55e' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
            כתב ההסמכה נחתם בהצלחה
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            האישור נשמר במערכת
          </p>
        </div>
      ) : (
        <>
          <div className="glass-panel rounded-xl p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="description" className="text-2xl" style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>כתב הסמכה למשכנתא</h3>
            </div>
            <pre className="text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-lg"
              style={{
                fontFamily: 'var(--font-rounded)',
                color: 'var(--color-on-surface)',
                background: 'var(--color-surface-container-low)',
                direction: 'rtl',
              }}>
              {DOC_TEXT}
            </pre>
          </div>

          <label className="glass-panel rounded-xl p-5 flex items-center gap-4 cursor-pointer mb-6"
            style={{ border: checked ? '2px solid var(--color-primary)' : undefined }}>
            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
              style={{
                background: checked ? 'var(--color-primary)' : 'transparent',
                borderColor: checked ? 'var(--color-primary)' : 'var(--color-outline)',
              }}>
              {checked && <Icon name="check" className="text-base" style={{ color: 'white' }} />}
            </div>
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>
              קראתי ואני מאשר/ת את תנאי ההסמכה
            </span>
          </label>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg flex items-center gap-2"
              style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
              <Icon name="error" filled className="text-xl flex-shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          <button
            disabled={!checked || loading}
            onClick={onSign}
            className="rounded-full font-bold py-3 px-10 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}>
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                שומר...
              </>
            ) : (
              <>
                חתימה ואישור
                <Icon name="draw" className="text-xl" />
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
