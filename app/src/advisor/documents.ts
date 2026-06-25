import type { RequestDocument } from './types'

export function approveDocument(documents: RequestDocument[], docId: string): RequestDocument[] {
  return documents.map((doc) => (doc.id === docId ? { ...doc, status: 'אושר', rejectionReason: undefined } : doc))
}

export function rejectDocument(documents: RequestDocument[], docId: string, reason: string): RequestDocument[] {
  if (reason.trim() === '') throw new Error('rejection reason is required')
  return documents.map((doc) => (doc.id === docId ? { ...doc, status: 'נדחה', rejectionReason: reason } : doc))
}