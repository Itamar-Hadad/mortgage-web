import { useTranslation } from 'react-i18next'
import { suggestedMaxPayment } from '../validation'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

export function PaymentRangeStep({ draft, update }: StepProps) {
  const { t } = useTranslation()
  const suggested = suggestedMaxPayment(draft)

  return (
    <div className="space-y-6">
      {suggested > 0 && (
        <div className="rounded-xl p-5 flex items-center gap-4"
          style={{ background: 'rgba(112,234,255,0.12)', border: '1px solid rgba(0,104,117,0.2)' }}>
          <span className="material-symbols-outlined text-3xl flex-shrink-0" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>
            calculate
          </span>
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--color-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ₪{Math.round(suggested).toLocaleString('he-IL')}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {t('q.payment_range.suggested_max')} — {t('q.payment_range.suggested_hint')}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="ss-label">{t('q.payment_range.min')} (₪)</label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            className="ss-input pe-10"
            value={draft.minPay}
            onChange={(e) => update({ minPay: toNum(e.target.value) })}
            placeholder="3,000"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: 'var(--color-outline)' }}>₪</span>
        </div>
      </div>

      <div>
        <label className="ss-label">{t('q.payment_range.max')} (₪)</label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            className="ss-input pe-10"
            value={draft.maxPayDesired}
            onChange={(e) => update({ maxPayDesired: toNum(e.target.value) })}
            placeholder={suggested > 0 ? Math.round(suggested).toString() : '8,000'}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: 'var(--color-outline)' }}>₪</span>
        </div>
      </div>
    </div>
  )
}
