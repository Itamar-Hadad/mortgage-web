import { useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../../shared/firebase'
import { calcMix } from '../../calc-engine/mix'
import { mixRisk } from '../../calc-engine/risk'
import type { QuestionnaireDraft, ProposedMix } from '../questionnaire/types'
import type { Route, MixCalc } from '../../calc-engine/types'
import type { MixRiskResult } from '../../calc-engine/risk'

export interface MixResult {
  mix: ProposedMix
  calc: MixCalc
  risk: MixRiskResult
}

export type CalcStatus = 'idle' | 'loading' | 'done' | 'error'

function buildMixRoutes(draft: QuestionnaireDraft, templateIndex: number): Route[] {
  const loanAmount = Number(draft.propertyValue || 0) - Number(draft.equity || 0)
  if (loanAmount <= 0) return []

  const templates: Array<{ name: string; routes: Array<Omit<Route, 'amount'> & { pct: number }> }> = [
    {
      name: 'תמהיל מאוזן',
      routes: [
        { kind: 'fixed', anchor: 0.05, margin: 0, years: 20, board: 'שפיצר', indexType: 'ללא', pct: 0.33 },
        { kind: 'prime', anchor: 0.0165, margin: 0.015, years: 20, board: 'שפיצר', indexType: 'ללא', pct: 0.33 },
        { kind: 'fixed', anchor: 0.03, margin: 0, years: 20, board: 'שפיצר', indexType: 'מדד', pct: 0.34 },
      ],
    },
    {
      name: 'תמהיל קצר סיכון',
      routes: [
        { kind: 'prime', anchor: 0.0165, margin: 0.015, years: 15, board: 'שפיצר', indexType: 'ללא', pct: 0.5 },
        { kind: 'fixed', anchor: 0.05, margin: 0, years: 15, board: 'שפיצר', indexType: 'ללא', pct: 0.5 },
      ],
    },
    {
      name: 'תמהיל ארוך חסכוני',
      routes: [
        { kind: 'fixed', anchor: 0.045, margin: 0, years: 30, board: 'שפיצר', indexType: 'ללא', pct: 0.5 },
        { kind: 'fixed', anchor: 0.025, margin: 0, years: 30, board: 'שפיצר', indexType: 'מדד', pct: 0.5 },
      ],
    },
    {
      name: 'תמהיל פריים דומיננטי',
      routes: [
        { kind: 'prime', anchor: 0.0165, margin: 0.015, years: 20, board: 'שפיצר', indexType: 'ללא', pct: 0.67 },
        { kind: 'fixed', anchor: 0.05, margin: 0, years: 20, board: 'שפיצר', indexType: 'ללא', pct: 0.33 },
      ],
    },
    {
      name: 'תמהיל קרן שווה',
      routes: [
        { kind: 'fixed', anchor: 0.05, margin: 0, years: 20, board: 'קרן שווה', indexType: 'ללא', pct: 0.5 },
        { kind: 'prime', anchor: 0.0165, margin: 0.015, years: 20, board: 'קרן שווה', indexType: 'ללא', pct: 0.5 },
      ],
    },
  ]

  const tpl = templates[templateIndex]
  return tpl.routes.map((r) => {
    const { pct, ...rest } = r
    return { ...rest, amount: Math.round(loanAmount * pct), sharePct: Math.round(pct * 100) }
  })
}

// In production (PROD=true, replaced at build time), calls the Cloud Functions.
// In dev, runs the same engine locally (avoids CORS issues on localhost).
async function computeMix(routes: Route[], isProd: boolean): Promise<{ calc: MixCalc; risk: MixRiskResult }> {
  if (isProd) {
    const fns = getFunctions(app, 'us-central1')
    const calcMixFn = httpsCallable<{ routes: Route[]; params: object }, MixCalc>(fns, 'calcMixCallable')
    const mixRiskFn = httpsCallable<{ routes: Route[] }, MixRiskResult>(fns, 'mixRiskCallable')
    const [calcRes, riskRes] = await Promise.all([
      calcMixFn({ routes, params: {} }),
      mixRiskFn({ routes }),
    ])
    return { calc: calcRes.data, risk: riskRes.data }
  }
  return { calc: calcMix(routes, {}), risk: mixRisk(routes) }
}

export function useCalcMixes(draft: QuestionnaireDraft): { results: MixResult[]; status: CalcStatus; error: string } {
  const [results, setResults] = useState<MixResult[]>([])
  const [status, setStatus] = useState<CalcStatus>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus('loading')
    setError('')

    const isProd = import.meta.env.PROD

    const mixNames = [
      'תמהיל מאוזן',
      'תמהיל קצר סיכון',
      'תמהיל ארוך חסכוני',
      'תמהיל פריים דומיננטי',
      'תמהיל קרן שווה',
    ]

    Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        const routes = buildMixRoutes(draft, i)
        const { calc, risk } = await computeMix(routes, isProd)
        const mix: ProposedMix = {
          id: `t${i + 1}`,
          name: mixNames[i],
          routes: routes.map((r) => ({
            kind: r.kind ?? 'fixed',
            sharePct: r.sharePct ?? 0,
            amount: r.amount,
            years: r.years,
            board: r.board ?? 'שפיצר',
            indexType: (r.indexType as 'ללא' | 'מדד' | 'דולר' | 'אירו') ?? 'ללא',
            anchor: r.anchor,
            margin: r.margin,
          })),
          risk: risk.level ?? 1,
          firstMonthlyPayment: calc.firstPay,
          totalPayment: calc.total,
          totalInterestAndIndexation: calc.interest + calc.indexation,
        }
        return { mix, calc, risk }
      })
    )
      .then((res) => {
        setResults(res)
        setStatus('done')
      })
      .catch((e: Error) => {
        setError(e.message)
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { results, status, error }
}
