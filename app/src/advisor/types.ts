// requests/{uid} document shape, advisor-screen slice (issue #8).
// personal/financial/loans/mixes mirror QuestionnaireDraft (see
// consumer-flow/questionnaire/types.ts) per CONTEXT.md's "בקשה" definition —
// 1:1 with the pre-registration draft once #5 migrates it into Firestore.
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
  financial: {
    loanPurpose: LoanPurpose | ''
    propertySource: PropertySource | ''
    propertyValue: number | ''
    equity: number | ''
    minPay: number | ''
    maxPayDesired: number | ''
  }
  additionalIncome: AdditionalIncome[]
  loans: ExistingLoan[]
  mixes: ProposedMix[]
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
