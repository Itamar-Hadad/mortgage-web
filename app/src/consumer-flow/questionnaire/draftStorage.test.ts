import { describe, test, expect, beforeEach } from 'vitest'
import {
  clearDraft,
  readDraft,
  readDraftForMigration,
  writeDraft,
} from './draftStorage'
import { emptyDraft, DRAFT_STORAGE_KEY } from './types'

describe('draftStorage', () => {
  beforeEach(() => localStorage.clear())

  test('write then read round-trips the draft', () => {
    const d = { ...emptyDraft(), equity: 250_000 as const }
    writeDraft(d)
    expect(readDraft().equity).toBe(250_000)
  })

  test('readDraftForMigration returns null when nothing was saved', () => {
    expect(readDraftForMigration()).toBeNull()
  })

  test('readDraftForMigration returns the draft once it exists', () => {
    writeDraft({ ...emptyDraft(), loanPurpose: 'נכס יחיד' })
    expect(readDraftForMigration()?.loanPurpose).toBe('נכס יחיד')
  })

  test('clearDraft removes the key', () => {
    writeDraft(emptyDraft())
    clearDraft()
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
    expect(readDraftForMigration()).toBeNull()
  })

  test('mixes defaults to an empty array (filled later by issue #3)', () => {
    expect(emptyDraft().mixes).toEqual([])
  })
})
