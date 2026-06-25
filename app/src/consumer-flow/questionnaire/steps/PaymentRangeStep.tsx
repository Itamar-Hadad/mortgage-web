import { useTranslation } from 'react-i18next'
import { suggestedMaxPayment } from '../validation'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

export function PaymentRangeStep({ draft, update }: StepProps) {
  const { t } = useTranslation()
  const suggested = suggestedMaxPayment(draft)
  return (
    <fieldset>
      <legend>{t('q.steps.payment_range')}</legend>

      <p>
        {t('q.payment_range.suggested_max')}: {Math.round(suggested).toLocaleString('he-IL')}
      </p>
      <p>{t('q.payment_range.suggested_hint')}</p>

      <label>
        {t('q.payment_range.min')}
        <input
          type="number"
          inputMode="numeric"
          value={draft.minPay}
          onChange={(e) => update({ minPay: toNum(e.target.value) })}
        />
      </label>

      <label>
        {t('q.payment_range.max')}
        <input
          type="number"
          inputMode="numeric"
          value={draft.maxPayDesired}
          onChange={(e) => update({ maxPayDesired: toNum(e.target.value) })}
        />
      </label>
    </fieldset>
  )
}
