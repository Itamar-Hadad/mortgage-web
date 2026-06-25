import { doc, updateDoc, type Firestore } from 'firebase/firestore'
import { approveDocument, rejectDocument } from './documents'
import type { RequestDocument } from './types'

export async function approveDocumentInFirestore(
  db: Firestore,
  requestUid: string,
  documents: RequestDocument[],
  docId: string,
) {
  await updateDoc(doc(db, 'requests', requestUid), { documents: approveDocument(documents, docId) })
}

export async function rejectDocumentInFirestore(
  db: Firestore,
  requestUid: string,
  documents: RequestDocument[],
  docId: string,
  reason: string,
) {
  await updateDoc(doc(db, 'requests', requestUid), { documents: rejectDocument(documents, docId, reason) })
}