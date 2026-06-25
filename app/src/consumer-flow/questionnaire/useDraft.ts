import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DRAFT_STORAGE_KEY,
  emptyDraft,
  type QuestionnaireDraft,
} from './types'

// Single hook wrapping localStorage read/write for the questionnaire draft.
// This is the isolated client-state layer named in ARCHITECTURE.md §13 (ADR-0001):
// "שכבת ה-state בצד הקליינט (hook אחד שעוטף read/write)". Downstream consumers and
// tests go through this hook, never localStorage directly (per PRD Testing Decisions).

function readDraft(): QuestionnaireDraft {
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

export interface UseDraftResult {
  draft: QuestionnaireDraft
  /** Shallow-merge a patch into the draft and persist it. */
  update: (patch: Partial<QuestionnaireDraft>) => void
  /** Wipe the draft from localStorage and reset to empty (used on register/restart). */
  clear: () => void
}

export function useDraft(): UseDraftResult {
  const [draft, setDraft] = useState<QuestionnaireDraft>(readDraft)

  // Persist on every change (story #16 — autosave so a closed tab doesn't lose progress).
  // Skip the very first run: state was just hydrated from storage, no need to write back.
  const hydrated = useRef(false)
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // Storage full/blocked — nothing actionable here; the in-memory draft still works.
    }
  }, [draft])

  const update = useCallback((patch: Partial<QuestionnaireDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // ignore
    }
    setDraft(emptyDraft())
  }, [])

  return { draft, update, clear }
}
