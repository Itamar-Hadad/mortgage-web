import { addDoc, collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import type { AdvisorTask } from './types'

export async function addTask(
  db: Firestore,
  advisorUid: string,
  requestUid: string | null,
  text: string,
  dueDate?: string,
): Promise<void> {
  await addDoc(collection(db, 'tasks'), {
    advisorUid,
    requestUid,
    text,
    dueDate: dueDate ?? null,
    done: false,
    createdAt: new Date().toISOString(),
  })
}

export async function listTasksForAdvisor(db: Firestore, advisorUid: string): Promise<AdvisorTask[]> {
  const snapshot = await getDocs(query(collection(db, 'tasks'), where('advisorUid', '==', advisorUid)))
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as AdvisorTask)
}