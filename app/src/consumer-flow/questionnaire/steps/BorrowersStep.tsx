import { useTranslation } from 'react-i18next'
import { emptyBorrower, type Borrower } from '../types'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

const MAX_BORROWERS = 5

export function BorrowersStep({ draft, update }: StepProps) {
  const { t } = useTranslation()

  function patchBorrower(index: number, patch: Partial<Borrower>) {
    const borrowers = draft.borrowers.map((b, i) => (i === index ? { ...b, ...patch } : b))
    update({ borrowers })
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
    <fieldset>
      <legend>{t('q.steps.borrowers')}</legend>

      {/* All borrowers in one table, not a screen per borrower (ADR §3, story #9). */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t('q.borrowers.first')}</th>
            <th>{t('q.borrowers.last')}</th>
            <th>{t('q.borrowers.birth')}</th>
            <th>{t('q.borrowers.income')}</th>
            <th>{t('q.borrowers.is_owner')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {draft.borrowers.map((b, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <input
                  aria-label={`${t('q.borrowers.first')} ${i + 1}`}
                  value={b.first}
                  onChange={(e) => patchBorrower(i, { first: e.target.value })}
                />
              </td>
              <td>
                <input
                  aria-label={`${t('q.borrowers.last')} ${i + 1}`}
                  value={b.last}
                  onChange={(e) => patchBorrower(i, { last: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="date"
                  aria-label={`${t('q.borrowers.birth')} ${i + 1}`}
                  value={b.birth}
                  onChange={(e) => patchBorrower(i, { birth: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label={`${t('q.borrowers.income')} ${i + 1}`}
                  value={b.income}
                  onChange={(e) => patchBorrower(i, { income: toNum(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  aria-label={`${t('q.borrowers.is_owner')} ${i + 1}`}
                  checked={b.isPropertyOwner}
                  onChange={(e) => patchBorrower(i, { isPropertyOwner: e.target.checked })}
                />
              </td>
              <td>
                {draft.borrowers.length > 1 && (
                  <button type="button" onClick={() => removeBorrower(i)}>
                    {t('q.borrowers.remove')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>{t('q.borrowers.not_owner_hint')}</p>

      {draft.borrowers.length < MAX_BORROWERS && (
        <button type="button" onClick={addBorrower}>
          {t('q.borrowers.add')}
        </button>
      )}
    </fieldset>
  )
}
