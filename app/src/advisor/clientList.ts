import type { MortgageRequest } from './types'

export function nextActionDate(request: MortgageRequest): Date | null {
  const pendingTimes = request.documents
    .filter((doc) => doc.status === 'ממתין לבדיקה')
    .map((doc) => new Date(doc.submittedAt).getTime())
  if (pendingTimes.length === 0) return null
  return new Date(Math.min(...pendingTimes))
}

export function clientsForAdvisor(requests: MortgageRequest[], advisorUid: string): MortgageRequest[] {
  return requests.filter((request) => request.assignedAdvisorUid === advisorUid)
}

export function searchClients(requests: MortgageRequest[], query: string): MortgageRequest[] {
  const q = query.trim().toLowerCase()
  if (q === '') return requests
  return requests.filter((request) =>
    request.personal.some(
      (borrower) =>
        borrower.first.toLowerCase().includes(q) ||
        borrower.last.toLowerCase().includes(q) ||
        (borrower.idNumber ?? '').toLowerCase().includes(q),
    ),
  )
}

export function sortClientsForAdvisor(requests: MortgageRequest[]): MortgageRequest[] {
  return [...requests].sort((a, b) => {
    const dateA = nextActionDate(a)
    const dateB = nextActionDate(b)
    if (dateA && dateB) return dateA.getTime() - dateB.getTime()
    if (dateA) return -1
    if (dateB) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}