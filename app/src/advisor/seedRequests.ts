// Mock/seed requests for the advisor screen (issue #8). #5 (registration)
// has landed (writes real requests/{uid} via migrateDraftOnSignup.ts), but
// there's still no real signed-in *advisor* (only consumer role claims
// exist) and no admin (#11) to set assignedAdvisorUid — so this stays
// local-state seed data until that exists. Swapping this for a Firestore
// query (and CURRENT_ADVISOR_UID for the authenticated advisor's uid) is
// the integration point — see ARCHITECTURE.md §13.
import type { MortgageRequest } from './types'

export const CURRENT_ADVISOR_UID = 'advisor-demo'

export function seedRequests(): MortgageRequest[] {
  return [
    {
      uid: 'client-dana',
      assignedAdvisorUid: CURRENT_ADVISOR_UID,
      createdAt: '2026-05-01T00:00:00.000Z',
      personal: [
        { first: 'דנה', last: 'כהן', idNumber: '123456782', birth: '1990-04-12', income: 14000, isPropertyOwner: true },
      ],
      loanPurpose: 'נכס יחיד',
      propertySource: 'יד 2',
      financial: {
        propertyValue: 1800000,
        equity: 450000,
        minPay: 5000,
        maxPayDesired: 9000,
      },
      additionalIncome: [],
      loans: [],
      mixes: [
        {
          id: 't1',
          name: 'תמהיל מאוזן',
          routes: [
            { kind: 'fixed', sharePct: 60, amount: 800000, years: 25, board: 'שפיצר', indexType: 'ללא', anchor: 0.048, margin: 0 },
            { kind: 'prime', sharePct: 40, amount: 550000, years: 20, board: 'שפיצר', indexType: 'ללא', anchor: 0.057, margin: -0.005 },
          ],
          risk: 0,
          firstMonthlyPayment: 0,
          totalPayment: 0,
          totalInterestAndIndexation: 0,
        },
      ],
      documents: [
        {
          id: 'd1',
          type: 'תלוש שכר',
          status: 'ממתין לבדיקה',
          submittedAt: '2026-06-20T00:00:00.000Z',
          fileUrl: 'https://storage.example.com/mock/dana-payslip.pdf',
        },
        {
          id: 'd2',
          type: 'ת"ז',
          status: 'אושר',
          submittedAt: '2026-06-10T00:00:00.000Z',
          fileUrl: 'https://storage.example.com/mock/dana-id.pdf',
        },
      ],
      approvalStatus: 'בבדיקה',
      archived: false,
    },
    {
      uid: 'client-yoni',
      assignedAdvisorUid: CURRENT_ADVISOR_UID,
      createdAt: '2026-04-15T00:00:00.000Z',
      personal: [
        { first: 'יוני', last: 'לוי', idNumber: '987654321', birth: '1985-09-02', income: 22000, isPropertyOwner: true },
      ],
      loanPurpose: 'נכס נוסף',
      propertySource: 'קבלן',
      financial: {
        propertyValue: 2200000,
        equity: 900000,
        minPay: 7000,
        maxPayDesired: 12000,
      },
      additionalIncome: [{ type: 'שכירות', amount: 3500 }],
      loans: [{ remain: 40000, monthlyPayment: 1200, endDate: '2028-01-01', rate: 4.5, source: 'בנק הפועלים' }],
      mixes: [
        {
          id: 't1',
          name: 'תמהיל יוני',
          routes: [{ kind: 'fixed', sharePct: 100, amount: 1300000, years: 28, board: 'שפיצר', indexType: 'ללא', anchor: 0.046, margin: 0 }],
          risk: 0,
          firstMonthlyPayment: 0,
          totalPayment: 0,
          totalInterestAndIndexation: 0,
        },
      ],
      documents: [],
      approvalStatus: 'בבדיקה',
      archived: false,
    },
    {
      uid: 'client-avigail',
      assignedAdvisorUid: 'advisor-other',
      createdAt: '2026-06-01T00:00:00.000Z',
      personal: [
        { first: 'אביגיל', last: 'מזרחי', idNumber: '111223344', birth: '1992-01-20', income: 17000, isPropertyOwner: true },
      ],
      loanPurpose: 'נכס יחיד',
      propertySource: 'מחיר למשתכן',
      financial: {
        propertyValue: 1500000,
        equity: 300000,
        minPay: 4000,
        maxPayDesired: 7000,
      },
      additionalIncome: [],
      loans: [],
      mixes: [],
      documents: [],
      approvalStatus: 'בבדיקה',
      archived: false,
    },
  ]
}