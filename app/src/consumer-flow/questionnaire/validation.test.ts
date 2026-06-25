import { describe, test, expect } from 'vitest'
import { emptyDraft, type QuestionnaireDraft } from './types'
import {
  adjustedMonthlyIncome,
  financingRatio,
  maxFinancingPct,
  meetsMinEquity,
  requiredLoan,
  suggestedMaxPayment,
  validateStep,
} from './validation'

function draftWith(patch: Partial<QuestionnaireDraft>): QuestionnaireDraft {
  return { ...emptyDraft(), ...patch }
}

describe('maxFinancingPct', () => {
  test('מחיר למשתכן allows 90% regardless of purpose', () => {
    expect(maxFinancingPct('מחיר למשתכן', 'נכס יחיד')).toBe(0.9)
  })
  test('נכס נוסף is capped at 50%', () => {
    expect(maxFinancingPct('יד 2', 'נכס נוסף')).toBe(0.5)
  })
  test('default single property is 75%', () => {
    expect(maxFinancingPct('יד 2', 'נכס יחיד')).toBe(0.75)
  })
})

describe('financing math', () => {
  const d = draftWith({ propertyValue: 1_000_000, equity: 300_000 })
  test('requiredLoan = value - equity', () => {
    expect(requiredLoan(d)).toBe(700_000)
  })
  test('financingRatio = loan / value', () => {
    expect(financingRatio(d)).toBeCloseTo(0.7)
  })
})

describe('meetsMinEquity', () => {
  test('70% financing passes the 75% single-property cap', () => {
    const d = draftWith({ propertyValue: 1_000_000, equity: 300_000, loanPurpose: 'נכס יחיד', propertySource: 'יד 2' })
    expect(meetsMinEquity(d)).toBe(true)
  })
  test('80% financing fails the 75% cap', () => {
    const d = draftWith({ propertyValue: 1_000_000, equity: 200_000, loanPurpose: 'נכס יחיד', propertySource: 'יד 2' })
    expect(meetsMinEquity(d)).toBe(false)
  })
  test('85% financing passes for מחיר למשתכן (90% cap)', () => {
    const d = draftWith({ propertyValue: 1_000_000, equity: 150_000, loanPurpose: 'נכס יחיד', propertySource: 'מחיר למשתכן' })
    expect(meetsMinEquity(d)).toBe(true)
  })
  test('no property value yet → nothing to validate', () => {
    expect(meetsMinEquity(emptyDraft())).toBe(true)
  })
})

describe('adjustedMonthlyIncome', () => {
  test('non-owner contributes 50% of income; additional income counts in full', () => {
    const d = draftWith({
      borrowers: [
        { first: 'א', last: '', birth: '1990-01-01', income: 10_000, isPropertyOwner: true },
        { first: 'ב', last: '', birth: '1992-01-01', income: 8_000, isPropertyOwner: false },
      ],
      additionalIncome: [{ type: 'שכירות', amount: 2_000 }],
    })
    // 10000 + 8000*0.5 + 2000 = 16000
    expect(adjustedMonthlyIncome(d)).toBe(16_000)
  })
})

describe('suggestedMaxPayment', () => {
  test('~40% of adjusted income minus existing obligations', () => {
    const d = draftWith({
      borrowers: [{ first: 'א', last: '', birth: '1990-01-01', income: 20_000, isPropertyOwner: true }],
      loans: [{ remain: 50_000, monthlyPayment: 1_000, endDate: '', rate: '', source: '' }],
    })
    // 20000*0.4 - 1000 = 7000
    expect(suggestedMaxPayment(d)).toBe(7_000)
  })
  test('never negative', () => {
    const d = draftWith({
      borrowers: [{ first: 'א', last: '', birth: '1990-01-01', income: 1_000, isPropertyOwner: true }],
      loans: [{ remain: 0, monthlyPayment: 5_000, endDate: '', rate: '', source: '' }],
    })
    expect(suggestedMaxPayment(d)).toBe(0)
  })
})

describe('validateStep', () => {
  test('step 0 requires loan purpose and source', () => {
    expect(validateStep(0, emptyDraft()).valid).toBe(false)
    expect(validateStep(0, draftWith({ loanPurpose: 'נכס יחיד', propertySource: 'יד 2' })).valid).toBe(true)
  })
  test('step 1 blocks equity below minimum', () => {
    const tooLow = draftWith({ propertyValue: 1_000_000, equity: 100_000, loanPurpose: 'נכס יחיד', propertySource: 'יד 2' })
    expect(validateStep(1, tooLow).errorKey).toBe('q.errors.equity_too_low')
  })
  test('step 2 needs name, birth and income for each borrower', () => {
    const incomplete = draftWith({ borrowers: [{ first: '', last: '', birth: '', income: '', isPropertyOwner: true }] })
    expect(validateStep(2, incomplete).valid).toBe(false)
    const complete = draftWith({ borrowers: [{ first: 'דנה', last: 'כהן', birth: '1990-01-01', income: 12_000, isPropertyOwner: true }] })
    expect(validateStep(2, complete).valid).toBe(true)
  })
  test('step 5 rejects inverted min/max', () => {
    const inverted = draftWith({ minPay: 9_000, maxPayDesired: 5_000 })
    expect(validateStep(5, inverted).errorKey).toBe('q.errors.pay_range_inverted')
  })
})
