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
import { ResultsPage } from '../results/ResultsPage'
import type { StepProps } from './steps/StepProps'

const STEPS: Array<(props: StepProps) => React.ReactElement> = [
  PropertyStep,
  ValueEquityStep,
  BorrowersStep,
  AdditionalIncomeStep,
  LoansStep,
  PaymentRangeStep,
]

const STEP_ICONS = ['home', 'account_balance', 'group', 'payments', 'credit_card', 'calculate']

function Icon({
  name,
  filled = false,
  className = '',
  style,
}: {
  name: string
  filled?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

export function Questionnaire() {
  const { t } = useTranslation()
  const { draft, update, clear } = useDraft()
  const step = draft.currentStep
  const [done, setDone] = useState(false)
  const [showError, setShowError] = useState(false)

  const isLast = step === STEPS.length - 1
  const StepComponent = STEPS[step]
  const validity = validateStep(step, draft)
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100)

  function goNext() {
    if (!validity.valid) { setShowError(true); return }
    setShowError(false)
    if (isLast) { setDone(true) } else { update({ currentStep: step + 1 }) }
  }

  function goBack() {
    setShowError(false)
    update({ currentStep: Math.max(0, step - 1) })
  }

  if (done) {
    return (
      <ResultsPage
        draft={draft}
        onRestart={() => { clear(); setDone(false) }}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <AppHeader />

      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="bg-blob" style={{ top: '-15%', right: '-10%' }} />
        <div className="bg-blob-2" style={{ bottom: '-10%', left: '-10%', animationDelay: '-5s', animationDuration: '35s' }} />
      </div>

      <main className="relative flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-12" style={{ zIndex: 10 }}>
        {/* Step header */}
        <div className="w-full max-w-2xl mb-8 flex flex-col items-center text-center">
          <div className="mb-4">
            <span className="block font-bold tracking-widest uppercase mb-2 text-sm"
              style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-headline)' }}>
              {t('q.step_progress', { current: step + 1, total: STEPS.length })}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
              {t('q.title')}
            </h1>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden mb-8" style={{ background: 'var(--color-surface-container-highest)' }}>
            <div className="progress-bar-fill h-full rounded-full" style={{ width: `${progressPct}%`, background: 'var(--color-primary)' }} />
          </div>
          {/* Step pills */}
          <div className="flex gap-2 justify-center flex-wrap">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all"
                style={{
                  background: i < step ? 'var(--color-primary)' : i === step ? 'var(--color-primary-container)' : 'var(--color-surface-container)',
                  color: i < step ? 'var(--color-on-primary)' : i === step ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  fontFamily: 'var(--font-headline)',
                }}>
                {i < step ? <Icon name="check" className="text-base" /> : i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Quiz card */}
        <div className="glass-panel w-full max-w-2xl rounded-xl p-6 md:p-12">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(112,234,255,0.2)' }}>
              <Icon name={STEP_ICONS[step]} className="text-3xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
              {t(`q.steps.${['property','value_equity','borrowers','additional_income','loans','payment_range'][step]}`)}
            </h2>
          </div>

          <StepComponent draft={draft} update={update} />

          {showError && !validity.valid && validity.errorKey && (
            <div className="mt-4 px-4 py-3 rounded-lg flex items-center gap-2"
              style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
              role="alert">
              <Icon name="error" filled className="text-xl flex-shrink-0" />
              <span className="text-sm font-semibold">{t(validity.errorKey)}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center border-t pt-6"
            style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="flex items-center gap-2 font-bold py-2.5 px-6 rounded-full transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              <Icon name="arrow_forward" className="text-xl" />
              <span>{t('q.back')}</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-3 font-bold py-3.5 px-10 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}
            >
              <span>{isLast ? t('q.finish') : t('q.next')}</span>
              <Icon name="arrow_back" className="text-xl" />
            </button>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-8 opacity-80">
          <div className="flex items-center gap-2">
            <Icon name="lock" filled className="text-xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-headline)' }}>
              {t('q.privacy_note')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="devices" className="text-xl" style={{ color: 'var(--color-primary)' } as React.CSSProperties} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-headline)' }}>
              {t('q.cross_device_note')}
            </span>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

function AppHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-3"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(188,201,204,0.3)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>
          SimpleSave
        </span>
      </div>
      <Icon name="help_outline" className="text-2xl cursor-pointer transition-colors"
        style={{ color: 'var(--color-secondary)' } as React.CSSProperties} />
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="relative w-full py-10 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(188,201,204,0.2)', zIndex: 10 }}>
      <div className="flex flex-col items-center md:items-start gap-1">
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-secondary)' }}>
          SimpleSave
        </span>
        <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>© 2024 SimpleSave Financial. All rights reserved.</p>
      </div>
      <div className="flex gap-6">
        {['מדיניות פרטיות', 'תנאי שימוש', 'צור קשר'].map((label) => (
          <a key={label} href="#" className="text-sm transition-colors hover:text-primary"
            style={{ color: 'var(--color-on-surface-variant)' }}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
