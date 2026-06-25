import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCalcMixes } from './useCalcMixes'
import { Speedometer } from './Speedometer'
import { MixDetailChart } from './MixDetailChart'
import type { QuestionnaireDraft } from '../questionnaire/types'

function fmt(n: number) {
  return Math.round(n).toLocaleString('he-IL')
}

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
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

interface Props {
  draft: QuestionnaireDraft
  onRestart: () => void
}

export function ResultsPage({ draft, onRestart }: Props) {
  const { t } = useTranslation()
  const { results, status, error } = useCalcMixes(draft)
  const [openDetail, setOpenDetail] = useState<string | null>(null)
  const [showCta, setShowCta] = useState(false)

  const loanAmount = Number(draft.propertyValue || 0) - Number(draft.equity || 0)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <AppHeader t={t} />

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="bg-blob" style={{ top: '-15%', right: '-10%' }} />
        <div className="bg-blob-2" style={{ bottom: '-10%', left: '-10%', animationDelay: '-5s', animationDuration: '35s' }} />
      </div>

      <main className="relative flex-1 flex flex-col items-center px-4 pt-28 pb-16" style={{ zIndex: 10 }}>
        {/* Title */}
        <div className="w-full max-w-2xl mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
            {t('results.title')}
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)' }}>
            {t('results.subtitle')}
          </p>
          {loanAmount > 0 && (
            <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--color-primary)' }}>
              {t('results.loan_amount', { amount: fmt(loanAmount) })}
            </p>
          )}
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="glass-panel w-full max-w-2xl rounded-xl p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--color-on-surface-variant)' }}>{t('results.loading')}</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="glass-panel w-full max-w-2xl rounded-xl p-8 text-center">
            <Icon name="error" filled className="text-4xl mb-3" style={{ color: 'var(--color-error)' }} />
            <p className="font-bold mb-2" style={{ color: 'var(--color-error)' }}>{t('results.error_title')}</p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>{error}</p>
            <button onClick={onRestart} className="rounded-full font-bold py-3 px-8"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
              {t('results.back_to_questionnaire')}
            </button>
          </div>
        )}

        {/* Mix cards */}
        {status === 'done' && (
          <div className="w-full max-w-2xl flex flex-col gap-5">
            {results.map(({ mix, calc, risk }, idx) => {
              const isOpen = openDetail === mix.id
              return (
                <div key={mix.id}
                  className="glass-panel rounded-xl overflow-hidden transition-all">
                  {/* Card header */}
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
                      style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', fontFamily: 'var(--font-headline)' }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
                        {mix.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {mix.routes.map(r =>
                          `${r.kind === 'prime' ? t('results.route_prime') : r.kind === 'variable' ? t('results.route_variable') : t('results.route_fixed')} ${r.sharePct}%`
                        ).join(' · ')}
                      </p>
                    </div>
                    <Speedometer level={risk.level ?? mix.risk} label={risk.label} />
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 border-t" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
                    <MetricCell label={t('results.metric_monthly')} value={`₪${fmt(mix.firstMonthlyPayment)}`} />
                    <MetricCell label={t('results.metric_total')} value={`₪${fmt(mix.totalPayment)}`} highlight />
                    <MetricCell label={t('results.metric_interest')} value={`₪${fmt(mix.totalInterestAndIndexation)}`} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 px-5 py-4 border-t" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
                    <button
                      onClick={() => setShowCta(true)}
                      className="flex-1 rounded-full font-bold py-2.5 text-sm transition-all hover:brightness-110 active:scale-95"
                      style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }}>
                      {t('results.btn_select')}
                    </button>
                    <button
                      onClick={() => setOpenDetail(isOpen ? null : mix.id)}
                      className="flex items-center gap-1 rounded-full font-bold py-2.5 px-5 text-sm border transition-colors"
                      style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}>
                      {t('results.btn_detail')}
                      <Icon name={isOpen ? 'expand_less' : 'expand_more'} className="text-base" />
                    </button>
                  </div>

                  {/* Detail charts */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
                      <MixDetailChart calc={calc} mixId={mix.id} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* CTA popup */}
            {showCta && (
              <div
                className="fixed inset-0 flex items-center justify-center px-4"
                style={{ zIndex: 100, background: 'rgba(17,28,44,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShowCta(false)}
              >
                <div
                  className="glass-panel w-full max-w-lg rounded-xl p-10 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(112,234,255,0.2)' }}>
                    <Icon name="person_add" filled className="text-4xl" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
                    {t('results.cta_title')}
                  </h2>
                  <p className="mb-8" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {t('results.cta_body')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      className="rounded-full font-bold py-3 px-8 transition-all hover:brightness-110 active:scale-95"
                      style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)' }}>
                      {t('results.cta_register')}
                    </button>
                    <button
                      onClick={() => setShowCta(false)}
                      className="rounded-full font-bold py-3 px-8 border transition-colors"
                      style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}>
                      {t('results.cta_back')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center py-3 px-2 text-center">
      <span className="text-xs mb-1" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
      <span className="font-bold text-sm" style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-on-surface)', fontFamily: 'var(--font-headline)' }}>
        {value}
      </span>
    </div>
  )
}

function AppHeader({ t }: { t: (key: string) => string }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-3"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(188,201,204,0.3)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>
          {t('app_title')}
        </span>
      </div>
      <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
        {t('results.nav_new_mortgage')}
      </span>
    </header>
  )
}
