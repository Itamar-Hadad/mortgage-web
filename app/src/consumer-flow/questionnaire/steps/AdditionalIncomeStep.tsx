import { useTranslation } from 'react-i18next'
import type { AdditionalIncome, AdditionalIncomeType } from '../types'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

const TYPES: AdditionalIncomeType[] = ['קצבה', 'שכירות', 'אחר']

export function AdditionalIncomeStep({ draft, update }: StepProps) {
  const { t } = useTranslation()

  function patchRow(index: number, patch: Partial<AdditionalIncome>) {
    update({ additionalIncome: draft.additionalIncome.map((r, i) => (i === index ? { ...r, ...patch } : r)) })
  }

  function addRow() {
    update({ additionalIncome: [...draft.additionalIncome, { type: 'קצבה', amount: '' }] })
  }

  function removeRow(index: number) {
    update({ additionalIncome: draft.additionalIncome.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{t('q.additional_income.intro')}</p>

      {draft.additionalIncome.map((r, i) => (
        <div
          key={i}
          className="rounded-xl p-4 flex gap-3 items-end"
          style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(188,201,204,0.35)' }}
        >
          <div className="flex-1">
            <label className="ss-label">{t('q.additional_income.type')}</label>
            <select
              className="ss-input"
              aria-label={`${t('q.additional_income.type')} ${i + 1}`}
              value={r.type}
              onChange={(e) => patchRow(i, { type: e.target.value as AdditionalIncomeType })}
            >
              {TYPES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="ss-label">{t('q.additional_income.amount')} (₪)</label>
            <input
              type="number"
              inputMode="numeric"
              className="ss-input"
              aria-label={`${t('q.additional_income.amount')} ${i + 1}`}
              value={r.amount}
              onChange={(e) => patchRow(i, { amount: toNum(e.target.value) })}
              placeholder="0"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="mb-0.5 p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'var(--color-error)', background: 'var(--color-error-container)' }}
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-dashed"
        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
      >
        <span className="material-symbols-outlined text-xl">add</span>
        {t('q.additional_income.add')}
      </button>
    </div>
  )
}
