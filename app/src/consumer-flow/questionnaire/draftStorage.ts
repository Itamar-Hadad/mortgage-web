import {
  DRAFT_STORAGE_KEY,
  emptyDraft,
  type QuestionnaireDraft,
} from './types'

// Framework-free read/write/clear for the questionnaire draft (ADR-0001 seam).
// `useDraft` builds the React state layer on top of these; issue #5 (registration)
// uses `readDraftForMigration` + `clearDraft` directly, without depending on React.

/** Read the current draft (or an empty one if absent/corrupt). */
export function readDraft(): QuestionnaireDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return emptyDraft()
    const parsed = JSON.parse(raw) as Partial<QuestionnaireDraft>
    // Merge over an empty draft so missing/older fields get sane defaults.
    return { ...emptyDraft(), ...parsed, version: 1 }
  } catch {
    // Corrupt JSON or unavailable storage — start clean rather than crash.
    return emptyDraft()
  }
}

/** Persist the draft. */
export function writeDraft(draft: QuestionnaireDraft): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Storage full/blocked — nothing actionable here.
  }
}

/** Remove the draft from storage. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Entry point for issue #5 (registration): read the anonymous draft so it can be
 * written to Firestore `requests/{uid}` right after a uid is created. Returns `null`
 * when there is nothing to migrate (no questionnaire was filled in this browser).
 *
 * Typical use on the registration side:
 *   const draft = readDraftForMigration()
 *   if (draft) { await setDoc(doc(db, 'requests', uid), toRequest(draft)); clearDraft() }
 */
export function readDraftForMigration(): QuestionnaireDraft | null {
  try {
    if (!localStorage.getItem(DRAFT_STORAGE_KEY)) return null
  } catch {
    return null
  }
  return readDraft()
}
