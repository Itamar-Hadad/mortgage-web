import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { getStorage } from 'firebase-admin/storage'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB

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

export async function uploadDocument(request: CallableRequest<UploadDocumentInput>): Promise<UploadDocumentResult> {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר לפני העלאת מסמכים.')
  }
  if (request.auth.token['role'] !== 'consumer') {
    throw new HttpsError('permission-denied', 'רק צרכנים רשומים יכולים להעלות מסמכים.')
  }

  const { docType, fileBase64, fileName, mimeType } = request.data
  const uid = request.auth.uid

  // Validate mime type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    await writeRejection(uid, docType, `סוג קובץ לא נתמך: ${mimeType}. מותר: PDF, JPG, PNG.`)
    throw new HttpsError('invalid-argument', `סוג קובץ לא נתמך: ${mimeType}`)
  }

  // Validate size
  const buffer = Buffer.from(fileBase64, 'base64')
  if (buffer.byteLength > MAX_BYTES) {
    await writeRejection(uid, docType, `הקובץ גדול מדי (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB). מקסימום 15 MB.`)
    throw new HttpsError('invalid-argument', 'הקובץ גדול מ-15 MB.')
  }

  const docId = randomUUID()
  const ext = fileName.split('.').pop() ?? 'bin'
  const storagePath = `documents/${uid}/${docId}.${ext}`

  // Upload to Firebase Storage
  const bucket = getStorage().bucket()
  const file = bucket.file(storagePath)
  await file.save(buffer, { contentType: mimeType, metadata: { originalName: fileName } })

  // Make publicly readable via signed URL (1 year expiry)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  })

  // Write document record to requests/{uid}.documents array
  const db = getFirestore()
  const newDoc = {
    id: docId,
    type: docType,
    status: 'ממתין לבדיקה',
    submittedAt: new Date().toISOString(),
    fileUrl: signedUrl,
  }
  await db.doc(`requests/${uid}`).update({
    documents: FieldValue.arrayUnion(newDoc),
  })

  return { docId, fileUrl: signedUrl }
}

async function writeRejection(uid: string, docType: string, reason: string): Promise<void> {
  try {
    const db = getFirestore()
    const rejected = {
      id: randomUUID(),
      type: docType,
      status: 'נדחה',
      submittedAt: new Date().toISOString(),
      rejectionReason: reason,
    }
    await db.doc(`requests/${uid}`).update({
      documents: FieldValue.arrayUnion(rejected),
    })
  } catch {
    // best-effort — don't mask the original error
  }
}

export const uploadDocumentCallable = onCall(uploadDocument)
