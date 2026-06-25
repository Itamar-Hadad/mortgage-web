// Contract for the questionnaire draft written by issue #4 (anonymous "משכנתא חדשה"
// questionnaire) — see questionnaire-draft.md at the repo root, the source of truth
// agreed with whoever built #4. Per ADR-0001, the draft lives only in localStorage
// until signup. Once issue #4 lands its own
// `consumer-flow/questionnaire/draftStorage.ts` (`readDraftForMigration`/`clearDraft`),
// this module should be replaced by importing that one directly — the shape below is
// kept in lockstep with questionnaire-draft.md so that swap is a no-op for callers.
export const DRAFT_STORAGE_KEY = 'simplesave:newMortgageDraft:v1'

export interface QuestionnaireBorrower {
  first: string
  last: string
  birth: string
  income: number | ''
  isPropertyOwner: boolean
}

export interface AdditionalIncome {
  type: 'קצבה' | 'שכירות' | 'אחר'
  amount: number | ''
}

export interface ExistingLoan {
  remain: number | ''
  monthlyPayment: number | ''
  endDate: string
  rate: number | ''
  source: string
}

// Filled in by issue #3 (calc engine) into the same draft, after #2 finishes the
// borrower/financial fields. Issue #5 only passes this through to Firestore
// unchanged — its internal shape is #3/#4's contract, not ours.
export type ProposedMix = unknown

export interface QuestionnaireDraft {
  version: 1
  loanPurpose: 'נכס יחיד' | 'נכס נוסף' | 'לכל מטרה' | 'שיפור דיור' | ''
  propertySource: 'קבלן' | 'יד 2' | 'מחיר למשתכן' | 'בנייה עצמית' | ''
  propertyValue: number | ''
  equity: number | ''
  borrowers: QuestionnaireBorrower[]
  additionalIncome: AdditionalIncome[]
  loans: ExistingLoan[]
  minPay: number | ''
  maxPayDesired: number | ''
  mixes: ProposedMix[]
}

export function readDraft(): QuestionnaireDraft | null {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as QuestionnaireDraft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}
