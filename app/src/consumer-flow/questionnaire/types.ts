// QuestionnaireDraft — the shared contract for the anonymous "new mortgage"
// questionnaire (PRD section ב, stories #4-18).
//
// Per ADR-0001 this draft lives ONLY in localStorage before registration.
// It is the seam that downstream consumers read:
//   - issue #3 (calc engine) turns it into the 5 mixes / שעונים results
//   - issue #4 (registration) migrates it into Firestore `requests/{uid}`
//
// Field names mirror the existing simulator's `state.personal[]`/`state.financial`/
// `state.loans` (project files/סימולטור_משכנתא.html, defaultState()) so the migration
// to `requests/{uid}` (`personal[]`/`financial`/`loans`) is 1:1. New fields not present
// in the simulator are marked NEW.

export const DRAFT_STORAGE_KEY = 'simplesave:newMortgageDraft:v1'

/** סוג הלוואה — story #4. NEW (simulator only has housing/allPurpose). */
export type LoanPurpose =
  | 'נכס יחיד'
  | 'נכס נוסף'
  | 'לכל מטרה'
  | 'שיפור דיור'

/** מקור הנכס — story #5. NEW. Drives max-financing %. */
export type PropertySource =
  | 'קבלן'
  | 'יד 2'
  | 'מחיר למשתכן'
  | 'בנייה עצמית'

/** סוג הכנסה נוספת — story #12. NEW. */
export type AdditionalIncomeType = 'קצבה' | 'שכירות' | 'אחר'

/** לווה — mirrors simulator `personal[]` (first/last/birth/income). */
export interface Borrower {
  first: string
  last: string
  /** ISO date string (yyyy-mm-dd), as in the simulator. */
  birth: string
  /** הכנסה נטו חודשית. number when filled, '' while empty (matches simulator). */
  income: number | ''
  /** בעל הנכס — story #10. NEW. Non-owners count 50% of net income. */
  isPropertyOwner: boolean
}

/** הכנסה נוספת — story #12. NEW. */
export interface AdditionalIncome {
  type: AdditionalIncomeType
  amount: number | ''
}

/** הלוואה/הוצאה קבועה קיימת — story #13. Mirrors simulator `loans[]` and extends it. */
export interface ExistingLoan {
  /** סכום שנותר / יתרה. */
  remain: number | ''
  /** תשלום חודשי. */
  monthlyPayment: number | ''
  /** תאריך סיום (ISO yyyy-mm-dd). */
  endDate: string
  /** ריבית שנתית (%). */
  rate: number | ''
  /** מקור ההלוואה (בנק/חברת אשראי/אחר — free text). */
  source: string
}

export interface QuestionnaireDraft {
  /** Schema version, lets future consumers migrate safely. */
  version: 1
  loanPurpose: LoanPurpose | ''
  propertySource: PropertySource | ''
  /** שווי הנכס. NEW. */
  propertyValue: number | ''
  /** הון עצמי — mirrors simulator `financial.equity`. */
  equity: number | ''
  borrowers: Borrower[]
  additionalIncome: AdditionalIncome[]
  loans: ExistingLoan[]
  /** מינ׳ החזר חודשי רצוי — mirrors simulator `financial.minPay`. */
  minPay: number | ''
  /** מקס׳ החזר חודשי רצוי — mirrors simulator `financial.maxPayDesired`. */
  maxPayDesired: number | ''
}

export function emptyBorrower(): Borrower {
  return { first: '', last: '', birth: '', income: '', isPropertyOwner: true }
}

export function emptyDraft(): QuestionnaireDraft {
  return {
    version: 1,
    loanPurpose: '',
    propertySource: '',
    propertyValue: '',
    equity: '',
    borrowers: [emptyBorrower()],
    additionalIncome: [],
    loans: [],
    minPay: '',
    maxPayDesired: '',
  }
}
