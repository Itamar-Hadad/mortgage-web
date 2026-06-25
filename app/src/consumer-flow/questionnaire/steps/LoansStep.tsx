import { useTranslation } from 'react-i18next'
import type { ExistingLoan } from '../types'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

function emptyLoan(): ExistingLoan {
  return { remain: '', monthlyPayment: '', endDate: '', rate: '', source: '' }
}

export function LoansStep({ draft, update }: StepProps) {
  const { t } = useTranslation()

  function patchRow(index: number, patch: Partial<ExistingLoan>) {
    update({ loans: draft.loans.map((l, i) => (i === index ? { ...l, ...patch } : l)) })
  }

  function addRow() {
    update({ loans: [...draft.loans, emptyLoan()] })
  }

  function removeRow(index: number) {
    update({ loans: draft.loans.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{t('q.loans.intro')}</p>

      {draft.loans.map((l, i) => (
        <div
          key={i}
          className="rounded-xl p-5 space-y-3"
          style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(188,201,204,0.35)' }}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm" style={{ color: 'var(--color-secondary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              הלוואה {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: 'var(--color-error)' }}
            >
              <span className="material-symbols-outlined text-base">delete</span>
              {t('q.loans.remove')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('q.loans.remain')} (₪)</label>
              <input type="number" inputMode="numeric" className="ss-input"
                aria-label={`${t('q.loans.remain')} ${i + 1}`}
                value={l.remain} placeholder="0"
                onChange={(e) => patchRow(i, { remain: toNum(e.target.value) })} />
            </div>
            <div>
              <label className="ss-label">{t('q.loans.monthly')} (₪)</label>
              <input type="number" inputMode="numeric" className="ss-input"
                aria-label={`${t('q.loans.monthly')} ${i + 1}`}
                value={l.monthlyPayment} placeholder="0"
                onChange={(e) => patchRow(i, { monthlyPayment: toNum(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('q.loans.end_date')}</label>
              <input type="date" className="ss-input"
                aria-label={`${t('q.loans.end_date')} ${i + 1}`}
                value={l.endDate}
                onChange={(e) => patchRow(i, { endDate: e.target.value })} />
            </div>
            <div>
              <label className="ss-label">{t('q.loans.rate')}</label>
              <input type="number" inputMode="decimal" className="ss-input"
                aria-label={`${t('q.loans.rate')} ${i + 1}`}
                value={l.rate} placeholder="3.5"
                onChange={(e) => patchRow(i, { rate: toNum(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="ss-label">{t('q.loans.source')}</label>
            <input className="ss-input"
              aria-label={`${t('q.loans.source')} ${i + 1}`}
              value={l.source} placeholder="בנק לאומי"
              onChange={(e) => patchRow(i, { source: e.target.value })} />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-2 border-dashed transition-colors"
        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
      >
        <span className="material-symbols-outlined text-xl">add</span>
        {t('q.loans.add')}
      </button>
    </div>
  )
}
