import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore'

/** Assign (or reassign) a request to an advisor. Passing null unassigns it. */
export async function assignAdvisorInFirestore(
  db: Firestore,
  requestUid: string,
  advisorUid: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'requests', requestUid), { assignedAdvisorUid: advisorUid })
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
