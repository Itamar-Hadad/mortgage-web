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
    <fieldset>
      <legend>{t('q.steps.loans')}</legend>
      <p>{t('q.loans.intro')}</p>

      {draft.loans.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{t('q.loans.remain')}</th>
              <th>{t('q.loans.monthly')}</th>
              <th>{t('q.loans.end_date')}</th>
              <th>{t('q.loans.rate')}</th>
              <th>{t('q.loans.source')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {draft.loans.map((l, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label={`${t('q.loans.remain')} ${i + 1}`}
                    value={l.remain}
                    onChange={(e) => patchRow(i, { remain: toNum(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label={`${t('q.loans.monthly')} ${i + 1}`}
                    value={l.monthlyPayment}
                    onChange={(e) => patchRow(i, { monthlyPayment: toNum(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    aria-label={`${t('q.loans.end_date')} ${i + 1}`}
                    value={l.endDate}
                    onChange={(e) => patchRow(i, { endDate: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`${t('q.loans.rate')} ${i + 1}`}
                    value={l.rate}
                    onChange={(e) => patchRow(i, { rate: toNum(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${t('q.loans.source')} ${i + 1}`}
                    value={l.source}
                    onChange={(e) => patchRow(i, { source: e.target.value })}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => removeRow(i)}>
                    {t('q.loans.remove')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button type="button" onClick={addRow}>
        {t('q.loans.add')}
      </button>
    </fieldset>
  )
}
