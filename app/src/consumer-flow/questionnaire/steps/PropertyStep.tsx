import { useTranslation } from 'react-i18next'
import type { LoanPurpose, PropertySource } from '../types'
import type { StepProps } from './StepProps'

const LOAN_PURPOSES: { value: LoanPurpose; icon: string }[] = [
  { value: 'נכס יחיד',   icon: 'home' },
  { value: 'נכס נוסף',   icon: 'apartment' },
  { value: 'לכל מטרה',  icon: 'sync_alt' },
  { value: 'שיפור דיור', icon: 'upgrade' },
]

const PROPERTY_SOURCES: { value: PropertySource; icon: string }[] = [
  { value: 'קבלן',          icon: 'construction' },
  { value: 'יד 2',           icon: 'handshake' },
  { value: 'מחיר למשתכן', icon: 'volunteer_activism' },
  { value: 'בנייה עצמית',  icon: 'architecture' },
]

function Icon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {name}
    </span>
  )
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; icon: string }[]
  value: T | ''
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map(({ value: opt, icon }) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`option-card flex flex-col items-center justify-center p-6 rounded-lg text-center group ${active ? 'active' : ''}`}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors"
              style={{
                background: active ? 'rgba(112,234,255,0.35)' : 'rgba(112,234,255,0.15)',
              }}
            >
              <Icon name={icon} filled={active} />
            </div>
            <span
              className="font-bold text-base leading-snug"
              style={{ color: 'var(--color-on-surface)', fontFamily: "'Assistant', sans-serif" }}
            >
              {opt}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function PropertyStep({ draft, update }: StepProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-8">
      <div>
        <p className="font-semibold mb-3 text-base" style={{ color: 'var(--color-on-surface-variant)' }}>
          {t('q.property.loan_purpose')}
        </p>
        <OptionGrid
          options={LOAN_PURPOSES}
          value={draft.loanPurpose}
          onChange={(v) => update({ loanPurpose: v })}
        />
      </div>

      <div>
        <p className="font-semibold mb-3 text-base" style={{ color: 'var(--color-on-surface-variant)' }}>
          {t('q.property.property_source')}
        </p>
        <OptionGrid
          options={PROPERTY_SOURCES}
          value={draft.propertySource}
          onChange={(v) => update({ propertySource: v })}
        />
      </div>
    </div>
  )
}
