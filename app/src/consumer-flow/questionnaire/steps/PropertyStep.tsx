import { useTranslation } from 'react-i18next'
import type { LoanPurpose, PropertySource } from '../types'
import type { StepProps } from './StepProps'

const LOAN_PURPOSES: LoanPurpose[] = ['נכס יחיד', 'נכס נוסף', 'לכל מטרה', 'שיפור דיור']
const PROPERTY_SOURCES: PropertySource[] = ['קבלן', 'יד 2', 'מחיר למשתכן', 'בנייה עצמית']

export function PropertyStep({ draft, update }: StepProps) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend>{t('q.steps.property')}</legend>

      <label>
        {t('q.property.loan_purpose')}
        <select
          value={draft.loanPurpose}
          onChange={(e) => update({ loanPurpose: e.target.value as LoanPurpose })}
        >
          <option value="">—</option>
          {LOAN_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t('q.property.property_source')}
        <select
          value={draft.propertySource}
          onChange={(e) => update({ propertySource: e.target.value as PropertySource })}
        >
          <option value="">—</option>
          {PROPERTY_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}
