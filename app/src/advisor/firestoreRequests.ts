import type { MortgageRequest } from './types'

// Maps a requests/{uid} Firestore doc onto MortgageRequest, filling in fields
// that older/newly-migrated documents may not have written yet (approvalStatus,
// archived, assignedAdvisorUid, documents) — see migrateDraftOnSignup.ts.
export function docToMortgageRequest(uid: string, data: Record<string, unknown>): MortgageRequest {
  return {
    uid,
    assignedAdvisorUid: (data.assignedAdvisorUid as string | null | undefined) ?? null,
    createdAt: (data.createdAt as string) ?? '',
    personal: (data.personal as MortgageRequest['personal']) ?? [],
    loanPurpose: (data.loanPurpose as MortgageRequest['loanPurpose']) ?? '',
    propertySource: (data.propertySource as MortgageRequest['propertySource']) ?? '',
    financial: (data.financial as MortgageRequest['financial']) ?? { propertyValue: '', equity: '', minPay: '', maxPayDesired: '' },
    additionalIncome: (data.additionalIncome as MortgageRequest['additionalIncome']) ?? [],
    loans: (data.loans as MortgageRequest['loans']) ?? [],
    mixes: (data.mixes as MortgageRequest['mixes']) ?? [],
    questionnaireStep: data.questionnaireStep as number | undefined,
    documents: (data.documents as MortgageRequest['documents']) ?? [],
    approvalStatus: (data.approvalStatus as MortgageRequest['approvalStatus']) ?? 'בבדיקה',
    archived: (data.archived as boolean) ?? false,
  }
}