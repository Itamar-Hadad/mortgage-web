import type { MortgageRequest } from './types'

export interface ChecklistStatus {
  personal: boolean
  mortgage: boolean
  documents: boolean
  approval: boolean
}

export function checklistStatus(request: MortgageRequest): ChecklistStatus {
  const personal =
    request.personal.length > 0 &&
    request.personal.every((b) => b.first !== '' && b.last !== '' && b.birth !== '' && b.income !== '')

  const { propertyValue, equity } = request.financial
  const mortgage = request.loanPurpose !== '' && propertyValue !== '' && equity !== ''

  const documents = request.documents.length > 0 && request.documents.every((doc) => doc.status === 'אושר')

  const approval = request.approvalStatus === 'אושר'

  return { personal, mortgage, documents, approval }
}