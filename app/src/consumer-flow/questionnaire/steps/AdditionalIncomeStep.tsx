import { useTranslation } from 'react-i18next'
import type { AdditionalIncome, AdditionalIncomeType } from '../types'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

const TYPES: AdditionalIncomeType[] = ['קצבה', 'שכירות', 'אחר']

export function AdditionalIncomeStep({ draft, update }: StepProps) {
  const { t } = useTranslation()

  function patchRow(index: number, patch: Partial<AdditionalIncome>) {
    const additionalIncome = draft.additionalIncome.map((r, i) =>
      i === index ? { ...r, ...patch } : r,
    )
    update({ additionalIncome })
  }

  function addRow() {
    update({ additionalIncome: [...draft.additionalIncome, { type: 'קצבה', amount: '' }] })
  }

  function removeRow(index: number) {
    update({ additionalIncome: draft.additionalIncome.filter((_, i) => i !== index) })
  }

  return (
    <fieldset>
      <legend>{t('q.steps.additional_income')}</legend>
      <p>{t('q.additional_income.intro')}</p>

      {draft.additionalIncome.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{t('q.additional_income.type')}</th>
              <th>{t('q.additional_income.amount')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {draft.additionalIncome.map((r, i) => (
              <tr key={i}>
                <td>
                  <select
                    aria-label={`${t('q.additional_income.type')} ${i + 1}`}
                    value={r.type}
                    onChange={(e) => patchRow(i, { type: e.target.value as AdditionalIncomeType })}
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>
                        {ty}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label={`${t('q.additional_income.amount')} ${i + 1}`}
                    value={r.amount}
                    onChange={(e) => patchRow(i, { amount: toNum(e.target.value) })}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => removeRow(i)}>
                    {t('q.additional_income.remove')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button type="button" onClick={addRow}>
        {t('q.additional_income.add')}
      </button>
    </fieldset>
  )
}
