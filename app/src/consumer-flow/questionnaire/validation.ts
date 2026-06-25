import type { Borrower, PropertySource, QuestionnaireDraft } from './types'

// Pure rule functions for the questionnaire (PRD stories #5, #7, #10, #11, #14).
// No React, no I/O — unit-testable in isolation (per PRD Testing Decisions).

/** Coerce the `number | ''` field convention to a usable number. */
export function num(v: number | '' | undefined | null): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/**
 * Maximum financing percentage of property value (story #5, #7).
 * Bank of Israel-style caps: 75% generally (i.e. ≥25% equity), and up to 90%
 * for מחיר למשתכן. A "נכס נוסף" / investment-style purchase is more restricted (50%).
 */
export function maxFinancingPct(
  source: PropertySource | '',
  loanPurpose: QuestionnaireDraft['loanPurpose'],
): number {
  if (source === 'מחיר למשתכן') return 0.9
  if (loanPurpose === 'נכס נוסף') return 0.5
  return 0.75
}

/** Required loan amount = property value − equity (never negative). */
export function requiredLoan(draft: QuestionnaireDraft): number {
  return Math.max(0, num(draft.propertyValue) - num(draft.equity))
}

/** Actual financing ratio of the requested loan against property value. */
export function financingRatio(draft: QuestionnaireDraft): number {
  const value = num(draft.propertyValue)
  if (value <= 0) return 0
  return requiredLoan(draft) / value
}

/**
 * Whether equity clears the minimum for the chosen source/purpose (story #7).
 * Returns true when no property value entered yet (nothing to validate against).
 */
export function meetsMinEquity(draft: QuestionnaireDraft): boolean {
  const value = num(draft.propertyValue)
  if (value <= 0) return true
  const maxPct = maxFinancingPct(draft.propertySource, draft.loanPurpose)
  return financingRatio(draft) <= maxPct + 1e-9
}

/**
 * Adjusted net income for capacity (story #10): owners count 100% of their net
 * income, non-owners count 50%. Additional income counts in full.
 */
export function adjustedMonthlyIncome(draft: QuestionnaireDraft): number {
  const fromBorrowers = draft.borrowers.reduce((sum, b: Borrower) => {
    const inc = num(b.income)
    return sum + (b.isPropertyOwner ? inc : inc * 0.5)
  }, 0)
  const fromAdditional = draft.additionalIncome.reduce(
    (sum, a) => sum + num(a.amount),
    0,
  )
  return fromBorrowers + fromAdditional
}

/** Total monthly obligations from existing loans (reduce payment capacity, story #13). */
export function existingMonthlyObligations(draft: QuestionnaireDraft): number {
  return draft.loans.reduce((sum, l) => sum + num(l.monthlyPayment), 0)
}

/** Bank of Israel payment-to-income ceiling used for the suggested max (story #14). */
export const MAX_PAYMENT_RATIO = 0.4

/**
 * Suggested maximum monthly payment (story #14): ~40% of adjusted net income,
 * minus existing monthly obligations. Never negative.
 */
export function suggestedMaxPayment(draft: QuestionnaireDraft): number {
  const ceiling = adjustedMonthlyIncome(draft) * MAX_PAYMENT_RATIO
  return Math.max(0, ceiling - existingMonthlyObligations(draft))
}

export interface StepValidity {
  valid: boolean
  /** i18n key for the first blocking problem, if any. */
  errorKey?: string
}

/** Per-step gating used by the wizard's "next" button. */
export function validateStep(step: number, draft: QuestionnaireDraft): StepValidity {
  switch (step) {
    case 0: // property type & source
      if (!draft.loanPurpose) return { valid: false, errorKey: 'q.errors.loan_purpose_required' }
      if (!draft.propertySource) return { valid: false, errorKey: 'q.errors.property_source_required' }
      return { valid: true }
    case 1: // value & equity
      if (num(draft.propertyValue) <= 0) return { valid: false, errorKey: 'q.errors.property_value_required' }
      if (num(draft.equity) <= 0) return { valid: false, errorKey: 'q.errors.equity_required' }
      if (!meetsMinEquity(draft)) return { valid: false, errorKey: 'q.errors.equity_too_low' }
      return { valid: true }
    case 2: // borrowers
      if (draft.borrowers.length < 1) return { valid: false, errorKey: 'q.errors.borrower_required' }
      for (const b of draft.borrowers) {
        if (!b.first.trim() || !b.birth || num(b.income) <= 0) {
          return { valid: false, errorKey: 'q.errors.borrower_incomplete' }
        }
      }
      return { valid: true }
    case 3: // additional income (optional)
      return { valid: true }
    case 4: // existing loans (optional)
      return { valid: true }
    case 5: // desired payment range
      if (num(draft.maxPayDesired) <= 0) return { valid: false, errorKey: 'q.errors.max_pay_required' }
      if (num(draft.minPay) > num(draft.maxPayDesired)) {
        return { valid: false, errorKey: 'q.errors.pay_range_inverted' }
      }
      return { valid: true }
    default:
      return { valid: true }
  }
}
