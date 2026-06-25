import { test, expect, vi, beforeEach } from 'vitest'
import type { QuestionnaireDraft } from '../../consumer-flow/questionnaire/types'

const docMock = vi.fn()
const getDocMock = vi.fn()
const setDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'server-timestamp')

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}))

vi.mock('../../shared/firebase', () => ({ db: {} }))

const { migrateDraftOnSignup } = await import('./migrateDraftOnSignup')
const { DRAFT_STORAGE_KEY } = await import('../../consumer-flow/questionnaire/types')

const fullDraft: QuestionnaireDraft = {
  version: 1,
  loanPurpose: 'נכס יחיד',
  propertySource: 'יד 2',
  propertyValue: 2_000_000,
  equity: 600_000,
  borrowers: [{ first: 'דנה', last: 'כהן', birth: '1990-01-01', income: 18000, isPropertyOwner: false }],
  additionalIncome: [{ type: 'שכירות', amount: 2000 }],
  loans: [],
  minPay: 4000,
  maxPayDesired: 6000,
  mixes: [],
  currentStep: 3,
}

beforeEach(() => {
  localStorage.clear()
  docMock.mockReset().mockReturnValue('request-ref')
  getDocMock.mockReset()
  setDocMock.mockReset()
})

test('returning user (isNewUser=false) never writes or reads the draft', async () => {
  await migrateDraftOnSignup('uid-1', false)
  expect(getDocMock).not.toHaveBeenCalled()
  expect(setDocMock).not.toHaveBeenCalled()
})

test('new user writes the draft once to requests/{uid}, mapped per questionnaire-draft.md, and clears localStorage', async () => {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fullDraft))
  getDocMock.mockResolvedValue({ exists: () => false })

  await migrateDraftOnSignup('uid-2', true)

  expect(docMock).toHaveBeenCalledWith({}, 'requests', 'uid-2')
  expect(setDocMock).toHaveBeenCalledWith(
    'request-ref',
    expect.objectContaining({
      personal: fullDraft.borrowers,
      financial: {
        propertyValue: fullDraft.propertyValue,
        equity: fullDraft.equity,
        minPay: fullDraft.minPay,
        maxPayDesired: fullDraft.maxPayDesired,
      },
      loanPurpose: fullDraft.loanPurpose,
      propertySource: fullDraft.propertySource,
      additionalIncome: fullDraft.additionalIncome,
      loans: fullDraft.loans,
      mixes: fullDraft.mixes,
      questionnaireStep: fullDraft.currentStep,
      createdAt: 'server-timestamp',
    }),
  )
  expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
})

test('new user signup is idempotent: an existing requests/{uid} is never overwritten', async () => {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fullDraft))
  getDocMock.mockResolvedValue({ exists: () => true })

  await migrateDraftOnSignup('uid-3', true)

  expect(setDocMock).not.toHaveBeenCalled()
  // draft is left as-is when migration is skipped — only a successful write clears it
  expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull()
})

test('new user with no draft (e.g. agent intake never ran) still creates an empty requests/{uid}', async () => {
  getDocMock.mockResolvedValue({ exists: () => false })

  await migrateDraftOnSignup('uid-4', true)

  expect(setDocMock).toHaveBeenCalledWith(
    'request-ref',
    expect.objectContaining({
      personal: [],
      financial: { propertyValue: '', equity: '', minPay: '', maxPayDesired: '' },
      loanPurpose: '',
      propertySource: '',
      additionalIncome: [],
      loans: [],
      mixes: [],
      questionnaireStep: 0,
    }),
  )
})
