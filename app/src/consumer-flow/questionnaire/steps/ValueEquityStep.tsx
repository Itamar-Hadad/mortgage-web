import { useTranslation } from 'react-i18next'
import {
  financingRatio,
  maxFinancingPct,
  requiredLoan,
} from '../validation'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function ValueEquityStep({ draft, update }: StepProps) {
  const { t } = useTranslation()
  const maxPct = maxFinancingPct(draft.propertySource, draft.loanPurpose)
  return (
    <fieldset>
      <legend>{t('q.steps.value_equity')}</legend>

      <label>
        {t('q.value_equity.property_value')}
        <input
          type="number"
          inputMode="numeric"
          value={draft.propertyValue}
          onChange={(e) => update({ propertyValue: toNum(e.target.value) })}
        />
      </label>

      <label>
        {t('q.value_equity.equity')}
        <input
          type="number"
          inputMode="numeric"
          value={draft.equity}
          onChange={(e) => update({ equity: toNum(e.target.value) })}
        />
      </label>

      <p>
        {t('q.value_equity.required_loan')}: {requiredLoan(draft).toLocaleString('he-IL')}
      </p>
      <p>
        {t('q.value_equity.financing_ratio')}: {pct(financingRatio(draft))}
      </p>
      <p>
        {t('q.value_equity.max_financing')}: {pct(maxPct)}
      </p>
    </fieldset>
  )
}
