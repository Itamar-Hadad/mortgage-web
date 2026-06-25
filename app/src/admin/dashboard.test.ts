import { describe, expect, it } from 'vitest'
import { countRequestsByType } from './dashboard'
import type { MortgageRequest } from '../advisor/types'

function request(overrides: Partial<MortgageRequest> = {}): MortgageRequest {
  return {
    uid: 'u1',
    assignedAdvisorUid: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    personal: [],
    loanPurpose: 'נכס יחיד',
    propertySource: '',
    financial: { propertyValue: '', equity: '', minPay: '', maxPayDesired: '' },
    additionalIncome: [],
    loans: [],
    mixes: [],
    documents: [],
    approvalStatus: 'בבדיקה',
    archived: false,
    ...overrides,
  }
}

describe('countRequestsByType', () => {
  it('returns empty object when there are no requests', () => {
    expect(countRequestsByType([])).toEqual({})
  })

  it('counts a single request under its loanPurpose', () => {
    expect(countRequestsByType([request({ loanPurpose: 'נכס יחיד' })])).toEqual({ 'נכס יחיד': 1 })
  })

  it('aggregates counts across multiple requests of the same type', () => {
    const requests = [
      request({ uid: 'a', loanPurpose: 'נכס יחיד' }),
      request({ uid: 'b', loanPurpose: 'נכס יחיד' }),
      request({ uid: 'c', loanPurpose: 'נכס נוסף' }),
    ]
    expect(countRequestsByType(requests)).toEqual({ 'נכס יחיד': 2, 'נכס נוסף': 1 })
  })

  it('ignores archived requests', () => {
    const requests = [
      request({ uid: 'a', loanPurpose: 'נכס יחיד', archived: false }),
      request({ uid: 'b', loanPurpose: 'נכס יחיד', archived: true }),
    ]
    expect(countRequestsByType(requests)).toEqual({ 'נכס יחיד': 1 })
  })

  it('groups blank loanPurpose under "לא מצוין"', () => {
    expect(countRequestsByType([request({ loanPurpose: '' })])).toEqual({ 'לא מצוין': 1 })
  })
})
