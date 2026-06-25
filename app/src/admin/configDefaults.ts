import type { RiskRule } from '../calc-engine/risk'
import { defaultRiskRules } from '../calc-engine/risk'

// ── generalRates ──────────────────────────────────────────────────────────────
export type RateKey =
  | 'fixedUnlinked'
  | 'fixedLinked'
  | 'variable36Unlinked'
  | 'variable36Linked'
  | 'variable60Unlinked'
  | 'variable60Linked'
  | 'variable18_24Unlinked'
  | 'variable18_24Linked'
  | 'prime'

export interface RateRow {
  anchor: number
  margin: number
}

export type GeneralRates = Record<RateKey, RateRow>

export const RATE_KEY_LABELS: Record<RateKey, string> = {
  fixedUnlinked: 'קבועה לא צמודה',
  fixedLinked: 'קבועה צמודה מדד',
  variable36Unlinked: 'משתנה 36 לא צמודה',
  variable36Linked: 'משתנה 36 צמודה מדד',
  variable60Unlinked: 'משתנה 60 לא צמודה',
  variable60Linked: 'משתנה 60 צמודה מדד',
  variable18_24Unlinked: 'משתנה 18-24 לא צמודה',
  variable18_24Linked: 'משתנה 18-24 צמודה מדד',
  prime: 'פריים',
}

export const RATE_KEYS = Object.keys(RATE_KEY_LABELS) as RateKey[]

export function defaultGeneralRates(): GeneralRates {
  return {
    fixedUnlinked: { anchor: 4.62, margin: 0 },
    fixedLinked: { anchor: 4.62, margin: 0 },
    variable36Unlinked: { anchor: 4.7, margin: 0 },
    variable36Linked: { anchor: 4.7, margin: 0 },
    variable60Unlinked: { anchor: 4.7, margin: 0 },
    variable60Linked: { anchor: 4.7, margin: 0 },
    variable18_24Unlinked: { anchor: 4.7, margin: 0 },
    variable18_24Linked: { anchor: 4.7, margin: 0 },
    prime: { anchor: 4.56, margin: 0 },
  }
}

// ── clockTemplates ────────────────────────────────────────────────────────────
export type RouteKindOption = 'fixed' | 'variable' | 'prime'

export interface TemplateRoute {
  kind: RouteKindOption
  sharePct: number
  indexType: 'ללא' | 'מדד'
  anchor: number
  changeMonths?: number
}

export interface ClockTemplate {
  name: string
  routes: TemplateRoute[]
}

export type ClockTemplates = Record<string, ClockTemplate>

export function defaultClockTemplates(): ClockTemplates {
  return {
    clock1: {
      name: 'שעון 1',
      routes: [
        { kind: 'fixed', sharePct: 17, indexType: 'ללא', anchor: 4.62 },
        { kind: 'fixed', sharePct: 17, indexType: 'מדד', anchor: 4.62 },
        { kind: 'variable', sharePct: 30, indexType: 'ללא', anchor: 4.7, changeMonths: 36 },
        { kind: 'variable', sharePct: 15, indexType: 'מדד', anchor: 4.7, changeMonths: 60 },
        { kind: 'prime', sharePct: 21, indexType: 'ללא', anchor: 4.56 },
      ],
    },
    clock2: {
      name: 'שעון 2',
      routes: [
        { kind: 'fixed', sharePct: 33, indexType: 'ללא', anchor: 4.62 },
        { kind: 'fixed', sharePct: 0, indexType: 'מדד', anchor: 4.62 },
        { kind: 'variable', sharePct: 30, indexType: 'ללא', anchor: 4.7, changeMonths: 36 },
        { kind: 'variable', sharePct: 0, indexType: 'מדד', anchor: 4.7, changeMonths: 60 },
        { kind: 'prime', sharePct: 37, indexType: 'ללא', anchor: 4.56 },
      ],
    },
    clock3: {
      name: 'שעון 3',
      routes: [
        { kind: 'fixed', sharePct: 35, indexType: 'ללא', anchor: 4.62 },
        { kind: 'fixed', sharePct: 0, indexType: 'מדד', anchor: 4.62 },
        { kind: 'variable', sharePct: 0, indexType: 'ללא', anchor: 4.7, changeMonths: 36 },
        { kind: 'variable', sharePct: 0, indexType: 'מדד', anchor: 4.7, changeMonths: 60 },
        { kind: 'prime', sharePct: 65, indexType: 'ללא', anchor: 4.56 },
      ],
    },
    clock4: {
      name: 'שעון 4',
      routes: [
        { kind: 'fixed', sharePct: 17, indexType: 'ללא', anchor: 4.62 },
        { kind: 'fixed', sharePct: 17, indexType: 'מדד', anchor: 4.62 },
        { kind: 'variable', sharePct: 30, indexType: 'ללא', anchor: 4.7, changeMonths: 36 },
        { kind: 'variable', sharePct: 15, indexType: 'מדד', anchor: 4.7, changeMonths: 60 },
        { kind: 'prime', sharePct: 21, indexType: 'ללא', anchor: 4.56 },
      ],
    },
    clock5: {
      name: 'שעון 5',
      routes: [
        { kind: 'fixed', sharePct: 33, indexType: 'ללא', anchor: 4.62 },
        { kind: 'fixed', sharePct: 0, indexType: 'מדד', anchor: 4.62 },
        { kind: 'variable', sharePct: 0, indexType: 'ללא', anchor: 4.7, changeMonths: 36 },
        { kind: 'variable', sharePct: 0, indexType: 'מדד', anchor: 4.7, changeMonths: 60 },
        { kind: 'prime', sharePct: 67, indexType: 'ללא', anchor: 4.56 },
      ],
    },
  }
}

// ── monthlyIndices ────────────────────────────────────────────────────────────
export interface MonthlyIndexEntry {
  month: string
  rate: number
}

export interface IndicesConfig {
  annualExpected: number
  entries: MonthlyIndexEntry[]
}

export function defaultIndicesConfig(): IndicesConfig {
  return {
    annualExpected: 2.5,
    entries: [
      { month: '2026-01', rate: 0.2 },
      { month: '2026-02', rate: 0.3 },
      { month: '2026-03', rate: 0.4 },
      { month: '2026-04', rate: 0.5 },
      { month: '2026-05', rate: 0.3 },
      { month: '2026-06', rate: 0.2 },
    ],
  }
}

// ── re-export for convenience ─────────────────────────────────────────────────
export type { RiskRule }
export { defaultRiskRules }
