import type { MortgageRequest } from '../advisor/types'

/** Count non-archived requests grouped by loanPurpose. */
export function countRequestsByType(requests: MortgageRequest[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const r of requests) {
    if (r.archived) continue
    const key = r.loanPurpose || 'לא מצוין'
    result[key] = (result[key] ?? 0) + 1
  }
  return result
}
