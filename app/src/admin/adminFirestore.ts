import { addDoc, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore'

/** Assign (or reassign) a request to an advisor.
 *  When a new advisor is assigned, two standard tasks are automatically created:
 *  1. Review client documents and approve/reject them.
 *  2. Contact the client to schedule the next step.
 *  Passing null unassigns without creating tasks.
 */
export async function assignAdvisorInFirestore(
  db: Firestore,
  requestUid: string,
  advisorUid: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'requests', requestUid), { assignedAdvisorUid: advisorUid })

  if (!advisorUid) return

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dueDateStr = tomorrow.toISOString().split('T')[0]

  const taskBase = { advisorUid, requestUid, done: false, createdAt: serverTimestamp() }

  await Promise.all([
    addDoc(collection(db, 'tasks'), {
      ...taskBase,
      text: 'לעבור על פרטי הלקוח ולאשר את המסמכים',
      dueDate: dueDateStr,
    }),
    addDoc(collection(db, 'tasks'), {
      ...taskBase,
      text: 'ליצור קשר עם הלקוח לתיאום המשך התהליך',
      dueDate: dueDateStr,
    }),
  ])
}

/**
 * Read a managed config document from the `config` collection.
 * Returns null if the document doesn't exist yet.
 *
 * Config keys: 'generalRates' | 'riskRules' | 'clockTemplates' | 'monthlyIndices'
 */
export async function getConfigFromFirestore<T>(db: Firestore, configKey: string): Promise<T | null> {
  const snapshot = await getDoc(doc(db, 'config', configKey))
  if (!snapshot.exists()) return null
  return snapshot.data() as T
}

/** Write (overwrite) a managed config document. */
export async function saveConfigToFirestore<T extends object>(
  db: Firestore,
  configKey: string,
  value: T,
): Promise<void> {
  await setDoc(doc(db, 'config', configKey), value)
}
