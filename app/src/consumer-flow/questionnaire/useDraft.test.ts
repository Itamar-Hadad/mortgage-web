import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDraft } from './useDraft'
import { DRAFT_STORAGE_KEY } from './types'

describe('useDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('starts from an empty draft when storage is empty', () => {
    const { result } = renderHook(() => useDraft())
    expect(result.current.draft.borrowers).toHaveLength(1)
    expect(result.current.draft.loanPurpose).toBe('')
  })

  test('update persists to localStorage (write → read)', () => {
    const { result } = renderHook(() => useDraft())
    act(() => result.current.update({ propertyValue: 1_500_000, loanPurpose: 'נכס יחיד' }))

    const stored = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) as string)
    expect(stored.propertyValue).toBe(1_500_000)
    expect(stored.loanPurpose).toBe('נכס יחיד')
  })

  test('resumes a previously saved draft (read on mount)', () => {
    const { result, unmount } = renderHook(() => useDraft())
    act(() => result.current.update({ equity: 400_000 }))
    unmount()

    const { result: result2 } = renderHook(() => useDraft())
    expect(result2.current.draft.equity).toBe(400_000)
  })

  test('clear removes the draft and resets to empty', () => {
    const { result } = renderHook(() => useDraft())
    act(() => result.current.update({ equity: 400_000 }))
    act(() => result.current.clear())

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
    expect(result.current.draft.equity).toBe('')
  })

  test('corrupt storage falls back to an empty draft', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, '{not valid json')
    const { result } = renderHook(() => useDraft())
    expect(result.current.draft.borrowers).toHaveLength(1)
  })
})
