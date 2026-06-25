import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDraft } from './useDraft'
import { validateStep } from './validation'
import { PropertyStep } from './steps/PropertyStep'
import { ValueEquityStep } from './steps/ValueEquityStep'
import { BorrowersStep } from './steps/BorrowersStep'
import { AdditionalIncomeStep } from './steps/AdditionalIncomeStep'
import { LoansStep } from './steps/LoansStep'
import { PaymentRangeStep } from './steps/PaymentRangeStep'
import type { StepProps } from './steps/StepProps'

const STEPS: Array<(props: StepProps) => React.ReactElement> = [
  PropertyStep,
  ValueEquityStep,
  BorrowersStep,
  AdditionalIncomeStep,
  LoansStep,
  PaymentRangeStep,
]

export function Questionnaire() {
  const { t } = useTranslation()
  const { draft, update, clear } = useDraft()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [showError, setShowError] = useState(false)

  if (done) {
    return (
      <section>
        <h1>{t('q.done_title')}</h1>
        <p>{t('q.done_body')}</p>
        <button
          type="button"
          onClick={() => {
            clear()
            setStep(0)
            setDone(false)
          }}
        >
          {t('q.restart')}
        </button>
      </section>
    )
  }

  const isLast = step === STEPS.length - 1
  const StepComponent = STEPS[step]
  const validity = validateStep(step, draft)

  function goNext() {
    if (!validity.valid) {
      setShowError(true)
      return
    }
    setShowError(false)
    if (isLast) {
      setDone(true)
    } else {
      setStep((s) => s + 1)
    }
  }

  function goBack() {
    setShowError(false)
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <section>
      <h1>{t('q.title')}</h1>
      <p>{t('q.step_progress', { current: step + 1, total: STEPS.length })}</p>

      <StepComponent draft={draft} update={update} />

      {showError && !validity.valid && validity.errorKey && (
        <p role="alert">{t(validity.errorKey)}</p>
      )}

      <div>
        {step > 0 && (
          <button type="button" onClick={goBack}>
            {t('q.back')}
          </button>
        )}
        <button type="button" onClick={goNext}>
          {isLast ? t('q.finish') : t('q.next')}
        </button>
      </div>

      <p>{t('q.privacy_note')}</p>
      <p>{t('q.cross_device_note')}</p>
    </section>
  )
}
