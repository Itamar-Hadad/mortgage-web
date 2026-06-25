import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { financingRatio, maxFinancingPct, requiredLoan } from '../validation'
import type { StepProps } from './StepProps'
import { toNum } from './StepProps'

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

function NumericField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div>
      <label className="ss-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className="ss-input ps-4 pe-12"
          value={value}
          onChange={(e) => onChange(toNum(e.target.value))}
          placeholder={placeholder ?? '0'}
        />
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
          style={{ color: 'var(--color-outline)' }}
        >
          ₪
        </span>
      </div>
    </div>
  )
}

export function ValueEquityStep({ draft, update }: StepProps) {
  const { t } = useTranslation()
  const maxPct = maxFinancingPct(draft.propertySource, draft.loanPurpose)
  const ratio = financingRatio(draft)
  const loan = requiredLoan(draft)
  const overLimit = ratio > maxPct

  return (
    <div className="space-y-6">
      <NumericField
        label={t('q.value_equity.property_value')}
        value={draft.propertyValue}
        onChange={(v) => update({ propertyValue: v })}
        placeholder="1,500,000"
      />
      <NumericField
        label={t('q.value_equity.equity')}
        value={draft.equity}
        onChange={(v) => update({ equity: v })}
        placeholder="375,000"
      />

      {(draft.propertyValue !== '' && draft.equity !== '') && (
        <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--color-surface-container-low)' }}>
          <InfoRow label={t('q.value_equity.required_loan')} value={`₪${loan.toLocaleString('he-IL')}`} />
          <InfoRow
            label={t('q.value_equity.financing_ratio')}
            value={pct(ratio)}
            highlight={overLimit ? 'error' : ratio > maxPct * 0.9 ? 'warn' : 'ok'}
          />
          <InfoRow label={t('q.value_equity.max_financing')} value={pct(maxPct)} />
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'ok' | 'warn' | 'error'
}) {
  const valueColor =
    highlight === 'error'
      ? 'var(--color-error)'
      : highlight === 'warn'
      ? '#b45309'
      : 'var(--color-primary)'

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
      <span className="font-bold text-base" style={{ color: valueColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {value}
      </span>
    </div>
  )
}
