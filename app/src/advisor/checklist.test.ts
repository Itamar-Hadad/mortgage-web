import { describe, expect, it } from 'vitest'
import { checklistStatus } from './checklist'
import type { MortgageRequest } from './types'

function request(overrides: Partial<MortgageRequest> = {}): MortgageRequest {
  return {
    uid: 'u1',
    assignedAdvisorUid: 'advisor1',
    createdAt: '2026-01-01T00:00:00.000Z',
    personal: [],
    financial: { loanPurpose: '', propertySource: '', propertyValue: '', equity: '', minPay: '', maxPayDesired: '' },
    additionalIncome: [],
    loans: [],
    mixes: [],
    documents: [],
    approvalStatus: 'בבדיקה',
    archived: false,
    ...overrides,
  }
}

describe('checklistStatus', () => {
  it('marks every stage incomplete for a freshly-created request', () => {
    expect(checklistStatus(request())).toEqual({
      personal: false,
      mortgage: false,
      documents: false,
      approval: false,
    })
  })

  it('marks personal complete once every borrower has the required fields filled', () => {
    const incomplete = request({
      personal: [{ first: 'דנה', last: '', birth: '1990-01-01', income: 12000, isPropertyOwner: true }],
    })
    const complete = request({
      personal: [{ first: 'דנה', last: 'כהן', birth: '1990-01-01', income: 12000, isPropertyOwner: true }],
    })

    expect(checklistStatus(incomplete).personal).toBe(false)
    expect(checklistStatus(complete).personal).toBe(true)
  })

  it('marks mortgage complete once loan purpose, property value and equity are all filled', () => {
    const incomplete = request({
      financial: { loanPurpose: 'נכס יחיד', propertySource: 'קבלן', propertyValue: '', equity: 200000, minPay: '', maxPayDesired: '' },
    })
    const complete = request({
      financial: { loanPurpose: 'נכס יחיד', propertySource: 'קבלן', propertyValue: 1500000, equity: 200000, minPay: 3000, maxPayDesired: 6000 },
    })

    expect(checklistStatus(incomplete).mortgage).toBe(false)
    expect(checklistStatus(complete).mortgage).toBe(true)
  })

  it('marks documents complete only once every uploaded document is approved', () => {
    const none = request({ documents: [] })
    const pending = request({
      documents: [{ id: 'd1', type: 'ת"ז', status: 'ממתין לבדיקה', submittedAt: '2026-01-01T00:00:00.000Z' }],
    })
    const allApproved = request({
      documents: [{ id: 'd1', type: 'ת"ז', status: 'אושר', submittedAt: '2026-01-01T00:00:00.000Z' }],
    })

    expect(checklistStatus(none).documents).toBe(false)
    expect(checklistStatus(pending).documents).toBe(false)
    expect(checklistStatus(allApproved).documents).toBe(true)
  })

  it('marks approval complete only once approvalStatus is אושר', () => {
    expect(checklistStatus(request({ approvalStatus: 'בבדיקה' })).approval).toBe(false)
    expect(checklistStatus(request({ approvalStatus: 'נדחה' })).approval).toBe(false)
    expect(checklistStatus(request({ approvalStatus: 'אושר' })).approval).toBe(true)
  })
})