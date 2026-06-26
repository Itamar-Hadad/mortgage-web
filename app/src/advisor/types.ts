// requests/{uid} document shape, advisor-screen slice (issue #8).
// Mirrors the real shape issue #5's migrateDraftOnSignup.ts (toRequest())
// writes — see docs/contracts/questionnaire-draft.md: loanPurpose/
// propertySource are top-level fields, NOT nested under `financial`
// (financial is only propertyValue/equity/minPay/maxPayDesired, per
// ARCHITECTURE.md §2/§9). Keep this in sync with that contract, not with
// QuestionnaireDraft's own (flatter) shape.
import type {
  AdditionalIncome,
  Borrower,
  ExistingLoan,
  LoanPurpose,
  ProposedMix,
  PropertySource,
} from '../consumer-flow/questionnaire/types'

export type DocumentStatus = 'ממתין לבדיקה' | 'אושר' | 'נדחה'

export interface RequestDocument {
  id: string
  type: string
  status: DocumentStatus
  /** ISO timestamp the client submitted it. */
  submittedAt: string
  /** required when status === 'נדחה' */
  rejectionReason?: string
  /**
   * Storage download URL for the uploaded file. Undefined until issue #9
   * (document upload pipeline, currently blocked) writes a real file —
   * advisor screen renders a disabled "view" affordance until then.
   */
  fileUrl?: string
}

export type ApprovalStatus = 'בבדיקה' | 'אושר' | 'נדחה'

export interface MortgageRequest {
  uid: string
  /** null = not yet assigned to an advisor by admin (issue #11). */
  assignedAdvisorUid: string | null
  createdAt: string
  personal: Borrower[]
  loanPurpose: LoanPurpose | ''
  propertySource: PropertySource | ''
  financial: {
    propertyValue: number | ''
    equity: number | ''
    minPay: number | ''
    maxPayDesired: number | ''
  }
  additionalIncome: AdditionalIncome[]
  loans: ExistingLoan[]
  mixes: ProposedMix[]
  /** step the consumer reached in the questionnaire — written by #5, not read by #8 today. */
  questionnaireStep?: number
  documents: RequestDocument[]
  approvalStatus: ApprovalStatus
  /** advisor archived this client out of their active list — see clientList.ts. */
  archived: boolean
}

export interface AdvisorTask {
  id: string
  advisorUid: string
  /** null = משימה כללית, לא משויכת ללקוח ספציפי. */
  requestUid: string | null
  text: string
  dueDate?: string
  done: boolean
  notes?: string
  createdAt: string
}

/** advisors/{uid} — admin-managed advisor directory (issue: admin "יועצים" tab). */
export interface Advisor {
  uid: string
  firstName: string
  lastName: string
  email: string
}
