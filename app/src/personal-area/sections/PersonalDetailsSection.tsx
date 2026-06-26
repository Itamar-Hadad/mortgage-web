import { useState } from 'react'
import type { QuestionnaireDraft } from '../../consumer-flow/questionnaire/types'

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

const MARITAL_OPTIONS = ['רווק/ה', 'נשוי/אה', 'גרוש/ה', 'אלמן/ה']

interface Props {
  draft: QuestionnaireDraft
  onComplete: (borrowers: QuestionnaireDraft['borrowers']) => void
}

export function PersonalDetailsSection({ draft, onComplete }: Props) {
  const [borrowers, setBorrowers] = useState(
    draft.borrowers.map((b) => ({
      first: b.first,
      last: b.last,
      birth: b.birth,
      income: String(b.income ?? ''),
      marital: b.marital ?? '',
    }))
  )
  const [showError, setShowError] = useState(false)

  const update = (idx: number, field: string, value: string) => {
    setBorrowers((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b))
  }

  const allComplete = borrowers.every((b) => b.first && b.last && b.birth && b.income && b.marital)

  function handleSave() {
    if (!allComplete) { setShowError(true); return }
    // Map local form state back to QuestionnaireDraft['borrowers'] shape
    const updated: QuestionnaireDraft['borrowers'] = borrowers.map((b, idx) => ({
      ...draft.borrowers[idx],   // preserve any existing fields (idNumber, isPropertyOwner…)
      first: b.first,
      last: b.last,
      birth: b.birth,
      income: b.income === '' ? '' : Number(b.income),
      isPropertyOwner: draft.borrowers[idx]?.isPropertyOwner ?? true,
      marital: b.marital,
    }))
    onComplete(updated)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          פרטים אישיים
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          מלאו את הפרטים האישיים של כל הלווים
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {borrowers.map((b, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary-container)', color: 'var(--color-primary)', fontFamily: 'var(--font-headline)', fontWeight: 700 }}>
                {idx + 1}
              </div>
              <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>לווה {idx + 1}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ss-label">שם פרטי *</label>
                <input className="ss-input" value={b.first} onChange={(e) => update(idx, 'first', e.target.value)} placeholder="שם פרטי" />
              </div>
              <div>
                <label className="ss-label">שם משפחה *</label>
                <input className="ss-input" value={b.last} onChange={(e) => update(idx, 'last', e.target.value)} placeholder="שם משפחה" />
              </div>
              <div>
                <label className="ss-label">תאריך לידה *</label>
                <input className="ss-input" type="date" value={b.birth} onChange={(e) => update(idx, 'birth', e.target.value)} />
              </div>
              <div>
                <label className="ss-label">הכנסה נטו חודשית (₪) *</label>
                <input className="ss-input" type="number" value={b.income} onChange={(e) => update(idx, 'income', e.target.value)} placeholder="15000" />
              </div>
              <div className="col-span-2">
                <label className="ss-label">מצב משפחתי *</label>
                <div className="flex gap-2 flex-wrap">
                  {MARITAL_OPTIONS.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => update(idx, 'marital', opt)}
                      className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                      style={{
                        background: b.marital === opt ? 'var(--color-primary)' : 'transparent',
                        color: b.marital === opt ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                        borderColor: b.marital === opt ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showError && !allComplete && (
        <div className="mt-4 px-4 py-3 rounded-lg flex items-center gap-2"
          style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
          <Icon name="error" filled className="text-xl flex-shrink-0" />
          <span className="text-sm font-semibold">יש למלא את כל השדות הנדרשים</span>
        </div>
      )}

      <div className="mt-6">
        <button onClick={handleSave}
          className="rounded-full font-bold py-3 px-10 transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}>
          שמירה והמשך
          <Icon name="arrow_back" className="text-xl mr-2" />
        </button>
      </div>
    </div>
  )
}
