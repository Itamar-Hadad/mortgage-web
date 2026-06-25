// Runs against the real Firestore Emulator (advisor1 is an authenticated,
// rules-checked context) — see app/package.json's test:firestore script.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { rejectDocumentInFirestore } from './firestoreDocuments'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'simplesave-mortgage',
    firestore: {
      rules: readFileSync('../firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('rejectDocumentInFirestore', () => {
  it('writes the נדחה status and the rejection reason to Firestore', async () => {
    const documents = [
      { id: 'd1', type: 'ת"ז', status: 'ממתין לבדיקה' as const, submittedAt: '2026-01-01T00:00:00.000Z' },
    ]
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'requests', 'client1'), {
        assignedAdvisorUid: 'advisor1',
        documents,
      })
    })

    const advisorDb = testEnv.authenticatedContext('advisor1', { role: 'advisor' }).firestore()
    await rejectDocumentInFirestore(advisorDb, 'client1', documents, 'd1', 'התלוש לא קריא')

    let savedDocs: Array<{ status: string; rejectionReason?: string }> = []
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snapshot = await getDoc(doc(context.firestore(), 'requests', 'client1'))
      savedDocs = snapshot.data()?.documents ?? []
    })
    expect(savedDocs[0].status).toBe('נדחה')
    expect(savedDocs[0].rejectionReason).toBe('התלוש לא קריא')
  })
})