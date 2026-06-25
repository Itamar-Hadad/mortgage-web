import { describe, expect, it } from 'vitest'
import { clientsForAdvisor, nextActionDate, searchClients, sortClientsForAdvisor } from './clientList'
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

describe('nextActionDate', () => {
  it('returns null when there are no pending documents', () => {
    expect(nextActionDate(request({ documents: [] }))).toBeNull()
  })

  it('returns the submission date of a single pending document', () => {
    const r = request({
      documents: [
        { id: 'd1', type: 'תלוש שכר', status: 'ממתין לבדיקה', submittedAt: '2026-03-01T00:00:00.000Z' },
      ],
    })
    expect(nextActionDate(r)).toEqual(new Date('2026-03-01T00:00:00.000Z'))
  })

  it('ignores approved/rejected documents and picks the oldest pending one', () => {
    const r = request({
      documents: [
        { id: 'd1', type: 'תלוש שכר', status: 'אושר', submittedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'd2', type: 'ת"ז', status: 'ממתין לבדיקה', submittedAt: '2026-03-05T00:00:00.000Z' },
        { id: 'd3', type: 'אישור העברה', status: 'ממתין לבדיקה', submittedAt: '2026-03-02T00:00:00.000Z' },
        { id: 'd4', type: 'דוח בנק', status: 'נדחה', submittedAt: '2026-01-15T00:00:00.000Z', rejectionReason: 'לא קריא' },
      ],
    })
    expect(nextActionDate(r)).toEqual(new Date('2026-03-02T00:00:00.000Z'))
  })
})

describe('clientsForAdvisor', () => {
  it('keeps only requests assigned to the given advisor', () => {
    const mine = request({ uid: 'mine', assignedAdvisorUid: 'advisor1' })
    const theirs = request({ uid: 'theirs', assignedAdvisorUid: 'advisor2' })
    const unassigned = request({ uid: 'unassigned', assignedAdvisorUid: null })

    expect(clientsForAdvisor([mine, theirs, unassigned], 'advisor1')).toEqual([mine])
  })
})

describe('sortClientsForAdvisor', () => {
  it('puts the client with the most urgent (earliest) pending document first', () => {
    const urgent = request({
      uid: 'urgent',
      documents: [{ id: 'd1', type: 'ת"ז', status: 'ממתין לבדיקה', submittedAt: '2026-01-01T00:00:00.000Z' }],
    })
    const lessUrgent = request({
      uid: 'less-urgent',
      documents: [{ id: 'd2', type: 'ת"ז', status: 'ממתין לבדיקה', submittedAt: '2026-02-01T00:00:00.000Z' }],
    })

    expect(sortClientsForAdvisor([lessUrgent, urgent])).toEqual([urgent, lessUrgent])
  })

  it('puts clients with no pending action after clients with one, tie-broken by createdAt', () => {
    const noAction = request({ uid: 'no-action', createdAt: '2026-01-01T00:00:00.000Z', documents: [] })
    const olderNoAction = request({ uid: 'older-no-action', createdAt: '2025-06-01T00:00:00.000Z', documents: [] })
    const hasAction = request({
      uid: 'has-action',
      documents: [{ id: 'd1', type: 'ת"ז', status: 'ממתין לבדיקה', submittedAt: '2026-03-01T00:00:00.000Z' }],
    })

    expect(sortClientsForAdvisor([noAction, hasAction, olderNoAction])).toEqual([hasAction, olderNoAction, noAction])
  })
})

describe('searchClients', () => {
  const dana = request({
    uid: 'client-dana',
    personal: [{ first: 'דנה', last: 'כהן', idNumber: '123456782', birth: '1990-01-01', income: 1000, isPropertyOwner: true }],
  })
  const yoni = request({
    uid: 'client-yoni',
    personal: [{ first: 'יוני', last: 'לוי', idNumber: '987654321', birth: '1990-01-01', income: 1000, isPropertyOwner: true }],
  })

  it('returns every client when the query is empty', () => {
    expect(searchClients([dana, yoni], '')).toEqual([dana, yoni])
  })

  it('matches by partial first or last name, case/whitespace insensitive', () => {
    expect(searchClients([dana, yoni], '  כהן ')).toEqual([dana])
  })

  it('matches by partial ID number', () => {
    expect(searchClients([dana, yoni], '9876')).toEqual([yoni])
  })

  it('returns nothing when no client matches', () => {
    expect(searchClients([dana, yoni], 'שגיא')).toEqual([])
  })
})