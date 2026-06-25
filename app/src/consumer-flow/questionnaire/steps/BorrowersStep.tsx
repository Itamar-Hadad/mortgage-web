import { useTranslation } from 'react-i18next'
import { emptyBorrower, type Borrower } from '../types'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

const MAX_BORROWERS = 5

export function BorrowersStep({ draft, update }: StepProps) {
  const { t } = useTranslation()

  function patchBorrower(index: number, patch: Partial<Borrower>) {
    update({ borrowers: draft.borrowers.map((b, i) => (i === index ? { ...b, ...patch } : b)) })
  }

  function addBorrower() {
    if (draft.borrowers.length >= MAX_BORROWERS) return
    update({ borrowers: [...draft.borrowers, emptyBorrower()] })
  }

  function removeBorrower(index: number) {
    if (draft.borrowers.length <= 1) return
    update({ borrowers: draft.borrowers.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {draft.borrowers.map((b, i) => (
        <div
          key={i}
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(188,201,204,0.35)' }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-sm" style={{ color: 'var(--color-secondary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              לווה {i + 1}
            </span>
            {draft.borrowers.length > 1 && (
              <button
                type="button"
                onClick={() => removeBorrower(i)}
                className="text-sm font-semibold flex items-center gap-1 transition-colors"
                style={{ color: 'var(--color-error)' }}
              >
                <span className="material-symbols-outlined text-base">delete</span>
                {t('q.borrowers.remove')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('q.borrowers.first')}</label>
              <input
                className="ss-input"
                aria-label={`${t('q.borrowers.first')} ${i + 1}`}
                value={b.first}
                onChange={(e) => patchBorrower(i, { first: e.target.value })}
              />
            </div>
            <div>
              <label className="ss-label">{t('q.borrowers.last')}</label>
              <input
                className="ss-input"
                aria-label={`${t('q.borrowers.last')} ${i + 1}`}
                value={b.last}
                onChange={(e) => patchBorrower(i, { last: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('q.borrowers.birth')}</label>
              <input
                type="date"
                className="ss-input"
                aria-label={`${t('q.borrowers.birth')} ${i + 1}`}
                value={b.birth}
                onChange={(e) => patchBorrower(i, { birth: e.target.value })}
              />
            </div>
            <div>
              <label className="ss-label">{t('q.borrowers.income')} (₪)</label>
              <input
                type="number"
                inputMode="numeric"
                className="ss-input"
                aria-label={`${t('q.borrowers.income')} ${i + 1}`}
                value={b.income}
                onChange={(e) => patchBorrower(i, { income: toNum(e.target.value) })}
                placeholder="15,000"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: b.isPropertyOwner ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ [b.isPropertyOwner ? 'right' : 'left']: '4px' }}
              />
              <input
                type="checkbox"
                className="sr-only"
                aria-label={`${t('q.borrowers.is_owner')} ${i + 1}`}
                checked={b.isPropertyOwner}
                onChange={(e) => patchBorrower(i, { isPropertyOwner: e.target.checked })}
              />
            </div>
            <div>
              <span className="font-semibold text-sm block" style={{ color: 'var(--color-on-surface)' }}>
                {t('q.borrowers.is_owner')}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                {t('q.borrowers.not_owner_hint')}
              </span>
            </div>
          </label>
        </div>
      ))}

      {draft.borrowers.length < MAX_BORROWERS && (
        <button
          type="button"
          onClick={addBorrower}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-dashed"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          {t('q.borrowers.add')}
        </button>
      )}
    </div>
  )
}
