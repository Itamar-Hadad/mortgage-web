import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyDraft, type QuestionnaireDraft } from './types'
import { clearDraft, readDraft, writeDraft } from './draftStorage'

// React state layer over the questionnaire draft, built on the framework-free
// helpers in draftStorage.ts. This is the isolated client-state seam from
// ARCHITECTURE.md §13 (ADR-0001): "שכבת ה-state בצד הקליינט (hook אחד שעוטף read/write)".
// Components and tests go through this hook; issue #5 reads via draftStorage directly.

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
  // Skip the very first run (state was just hydrated from storage) and the run right
  // after a clear() (so the wiped key stays wiped instead of being re-written empty).
  const skipNextPersist = useRef(true)
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false
      return
    }
    writeDraft(draft)
  }, [draft])

  const update = useCallback((patch: Partial<QuestionnaireDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const clear = useCallback(() => {
    clearDraft()
    // Don't let the autosave effect re-persist the empty draft after we just wiped it.
    skipNextPersist.current = true
    setDraft(emptyDraft())
  }, [])

  return { draft, update, clear }
}
