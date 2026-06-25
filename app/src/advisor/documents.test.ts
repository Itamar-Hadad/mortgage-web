import { describe, expect, it } from 'vitest'
import { approveDocument, rejectDocument } from './documents'
import type { RequestDocument } from './types'

function pendingDoc(overrides: Partial<RequestDocument> = {}): RequestDocument {
  return { id: 'd1', type: 'ת"ז', status: 'ממתין לבדיקה', submittedAt: '2026-01-01T00:00:00.000Z', ...overrides }
}

describe('approveDocument', () => {
  it('sets the matching document status to אושר and leaves others untouched', () => {
    const docs = [pendingDoc({ id: 'd1' }), pendingDoc({ id: 'd2' })]
    const result = approveDocument(docs, 'd1')

    expect(result.find((d) => d.id === 'd1')?.status).toBe('אושר')
    expect(result.find((d) => d.id === 'd2')?.status).toBe('ממתין לבדיקה')
  })
})

describe('rejectDocument', () => {
  it('sets status to נדחה and records the reason', () => {
    const docs = [pendingDoc({ id: 'd1' })]
    const result = rejectDocument(docs, 'd1', 'הסכום בתלוש לא תואם')

    expect(result[0].status).toBe('נדחה')
    expect(result[0].rejectionReason).toBe('הסכום בתלוש לא תואם')
  })

  it('throws when no reason is given', () => {
    const docs = [pendingDoc({ id: 'd1' })]
    expect(() => rejectDocument(docs, 'd1', '')).toThrow()
  })
})