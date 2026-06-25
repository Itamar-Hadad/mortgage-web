import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useTranslation } from 'react-i18next'
import { db, functions } from '../../shared/firebase'
import type { RequestDocument } from '../../advisor/types'

interface UploadDocumentInput {
  docType: string
  fileBase64: string
  fileName: string
  mimeType: string
}

interface UploadDocumentResult {
  docId: string
  fileUrl: string
}

const uploadDocumentFn = httpsCallable<UploadDocumentInput, UploadDocumentResult>(
  functions,
  'uploadDocumentCallable',
)

export function useDocuments(uid: string) {
  const { t } = useTranslation()
  const [docs, setDocs] = useState<RequestDocument[]>([])
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      doc(db, 'requests', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setDocs((data.documents as RequestDocument[]) ?? [])
        }
      },
      () => { /* silent — user may not have a Firestore record yet */ },
    )
    return unsub
  }, [uid])

  const uploadDocument = useCallback(async (docType: string, file: File) => {
    setUploading((prev) => ({ ...prev, [docType]: true }))
    setErrors((prev) => ({ ...prev, [docType]: '' }))
    try {
      const fileBase64 = await toBase64(file)
      const result = await uploadDocumentFn({
        docType,
        fileBase64,
        fileName: file.name,
        mimeType: file.type,
      })
      // Optimistically update local state; onSnapshot will reconcile
      const newDoc: RequestDocument = {
        id: result.data.docId,
        type: docType,
        status: 'ממתין לבדיקה',
        submittedAt: new Date().toISOString(),
        fileUrl: result.data.fileUrl,
      }
      await updateDoc(doc(db, 'requests', uid), {
        documents: arrayUnion(newDoc),
      })
    } catch (e) {
      setErrors((prev) => ({ ...prev, [docType]: (e as Error).message || t('documents.upload_error') }))
    } finally {
      setUploading((prev) => ({ ...prev, [docType]: false }))
    }
  }, [uid, t])

  const allApproved = docs.length > 0 && docs.every((d) => d.status === 'אושר')
  const uploadedCount = docs.filter((d) => d.status !== undefined).length

  return { docs, uploading, errors, uploadDocument, allApproved, uploadedCount }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
