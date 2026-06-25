import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/firebase'
import { readDraft, clearDraft, type QuestionnaireDraft } from './draftStore'

// Maps the questionnaire's QuestionnaireDraft (questionnaire-draft.md) onto the
// requests/{uid} shape ARCHITECTURE.md §2/§9 defines: personal[] (=borrowers),
// financial (=propertyValue/equity/minPay/maxPayDesired), loans, mixes — plus the
// fields questionnaire-draft.md flags as new vs. the existing simulator
// (loanPurpose/propertySource/additionalIncome) kept as their own top-level fields.
function toRequest(draft: QuestionnaireDraft | null) {
  return {
    personal: draft?.borrowers ?? [],
    financial: {
      propertyValue: draft?.propertyValue ?? '',
      equity: draft?.equity ?? '',
      minPay: draft?.minPay ?? '',
      maxPayDesired: draft?.maxPayDesired ?? '',
    },
    loanPurpose: draft?.loanPurpose ?? '',
    propertySource: draft?.propertySource ?? '',
    additionalIncome: draft?.additionalIncome ?? [],
    loans: draft?.loans ?? [],
    mixes: draft?.mixes ?? [],
    createdAt: serverTimestamp(),
  }
}

// Issue #5 acceptance criteria: on signup, the draft is written exactly once to
// `requests/{uid}`, then cleared from localStorage; a returning user (isNewUser
// false) never creates a second requests/{uid}. requests/{uid} is the shared
// aggregate tracks B and C read/write — see issue #5 "הערת אינטגרציה".
export async function migrateDraftOnSignup(uid: string, isNewUser: boolean): Promise<void> {
  if (!isNewUser) return

  const requestRef = doc(db, 'requests', uid)
  const existing = await getDoc(requestRef)
  if (existing.exists()) return

  const draft = readDraft()
  await setDoc(requestRef, toRequest(draft))
  clearDraft()
}
