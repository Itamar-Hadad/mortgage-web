import { useTranslation } from 'react-i18next'
import type {
  AdditionalIncome,
  Borrower,
  ExistingLoan,
  LoanPurpose,
  PropertySource,
} from '../consumer-flow/questionnaire/types'
import type { MortgageRequest } from './types'

interface ClientDetailsProps {
  client: MortgageRequest
  onUpdateClient: (patch: Partial<MortgageRequest>) => void
}

const LOAN_PURPOSES: { value: LoanPurpose; labelKey: string }[] = [
  { value: 'נכס יחיד', labelKey: 'q.loan_purpose_options.single' },
  { value: 'נכס נוסף', labelKey: 'q.loan_purpose_options.additional' },
  { value: 'לכל מטרה', labelKey: 'q.loan_purpose_options.any' },
  { value: 'שיפור דיור', labelKey: 'q.loan_purpose_options.improvement' },
]

const PROPERTY_SOURCES: { value: PropertySource; labelKey: string }[] = [
  { value: 'קבלן', labelKey: 'q.property_source_options.contractor' },
  { value: 'יד 2', labelKey: 'q.property_source_options.second_hand' },
  { value: 'מחיר למשתכן', labelKey: 'q.property_source_options.subsidized' },
  { value: 'בנייה עצמית', labelKey: 'q.property_source_options.self_build' },
]

function toNum(v: string): number | '' {
  if (v === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? n : ''
}

export function ClientDetails({ client, onUpdateClient }: ClientDetailsProps) {
  const { t } = useTranslation()

  function patchBorrower(index: number, patch: Partial<Borrower>) {
    onUpdateClient({ personal: client.personal.map((b, i) => (i === index ? { ...b, ...patch } : b)) })
  }

  function patchFinancial(patch: Partial<MortgageRequest['financial']>) {
    onUpdateClient({ financial: { ...client.financial, ...patch } })
  }

  function patchIncome(index: number, patch: Partial<AdditionalIncome>) {
    onUpdateClient({ additionalIncome: client.additionalIncome.map((row, i) => (i === index ? { ...row, ...patch } : row)) })
  }

  function patchLoan(index: number, patch: Partial<ExistingLoan>) {
    onUpdateClient({ loans: client.loans.map((row, i) => (i === index ? { ...row, ...patch } : row)) })
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
          {t('advisor.checklist.personal')}
        </h3>
        {client.personal.map((borrower, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="ss-label">{t('q.borrowers.first')}</label>
              <input
                className="ss-input"
                value={borrower.first}
                onChange={(e) => patchBorrower(i, { first: e.target.value })}
              />
            </div>
            <div>
              <label className="ss-label">{t('q.borrowers.last')}</label>
              <input
                className="ss-input"
                value={borrower.last}
                onChange={(e) => patchBorrower(i, { last: e.target.value })}
              />
            </div>
            <div>
              <label className="ss-label">{t('q.borrowers.id_number')}</label>
              <input
                className="ss-input"
                value={borrower.idNumber ?? ''}
                onChange={(e) => patchBorrower(i, { idNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="ss-label">{t('q.borrowers.birth')}</label>
              <input
                type="date"
                className="ss-input"
                value={borrower.birth}
                onChange={(e) => patchBorrower(i, { birth: e.target.value })}
              />
            </div>
            <div>
              <label className="ss-label">{t('q.borrowers.income')}</label>
              <input
                type="number"
                className="ss-input"
                value={borrower.income}
                onChange={(e) => patchBorrower(i, { income: toNum(e.target.value) })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
          {t('advisor.checklist.mortgage')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ss-label">{t('q.property.loan_purpose')}</label>
            <select
              className="ss-input"
              value={client.financial.loanPurpose}
              onChange={(e) => patchFinancial({ loanPurpose: e.target.value as LoanPurpose })}
            >
              <option value="" />
              {LOAN_PURPOSES.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ss-label">{t('q.property.property_source')}</label>
            <select
              className="ss-input"
              value={client.financial.propertySource}
              onChange={(e) => patchFinancial({ propertySource: e.target.value as PropertySource })}
            >
              <option value="" />
              {PROPERTY_SOURCES.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ss-label">{t('q.value_equity.property_value')}</label>
            <input
              type="number"
              className="ss-input"
              value={client.financial.propertyValue}
              onChange={(e) => patchFinancial({ propertyValue: toNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="ss-label">{t('q.value_equity.equity')}</label>
            <input
              type="number"
              className="ss-input"
              value={client.financial.equity}
              onChange={(e) => patchFinancial({ equity: toNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="ss-label">{t('q.payment_range.min')}</label>
            <input
              type="number"
              className="ss-input"
              value={client.financial.minPay}
              onChange={(e) => patchFinancial({ minPay: toNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="ss-label">{t('q.payment_range.max')}</label>
            <input
              type="number"
              className="ss-input"
              value={client.financial.maxPayDesired}
              onChange={(e) => patchFinancial({ maxPayDesired: toNum(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {client.additionalIncome.length > 0 && (
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('q.steps.additional_income')}
          </h3>
          {client.additionalIncome.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <label className="ss-label">{t('q.additional_income.type')}</label>
                <input className="ss-input" value={row.type} onChange={(e) => patchIncome(i, { type: e.target.value as AdditionalIncome['type'] })} />
              </div>
              <div>
                <label className="ss-label">{t('q.additional_income.amount')}</label>
                <input
                  type="number"
                  className="ss-input"
                  value={row.amount}
                  onChange={(e) => patchIncome(i, { amount: toNum(e.target.value) })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {client.loans.length > 0 && (
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('q.steps.loans')}
          </h3>
          {client.loans.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <label className="ss-label">{t('q.loans.remain')}</label>
                <input
                  type="number"
                  className="ss-input"
                  value={row.remain}
                  onChange={(e) => patchLoan(i, { remain: toNum(e.target.value) })}
                />
              </div>
              <div>
                <label className="ss-label">{t('q.loans.monthly')}</label>
                <input
                  type="number"
                  className="ss-input"
                  value={row.monthlyPayment}
                  onChange={(e) => patchLoan(i, { monthlyPayment: toNum(e.target.value) })}
                />
              </div>
              <div>
                <label className="ss-label">{t('q.loans.source')}</label>
                <input className="ss-input" value={row.source} onChange={(e) => patchLoan(i, { source: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}