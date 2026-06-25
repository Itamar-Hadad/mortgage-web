export type RouteKind = 'fixed' | 'variable' | 'prime'
export type RouteBoard = 'שפיצר' | 'קרן שווה'
export type RouteBalloon = '' | 'בלון מלא' | 'בלון חלקי' | 'גרייס מלא' | 'גרייס חלקי'
export type RouteIndexType = '' | 'ללא' | 'מדד' | 'דולר' | 'אירו'

export interface PurposeSplit {
  housing: number
  allPurpose: number
}

/** route shape mirrors the original simulator's route objects — see calc-engine/README.md */
export interface Route {
  kind?: RouteKind
  rateType?: 'קבועה' | 'משתנה'
  anchorType?: '' | 'פריים' | 'פק"מ' | 'אג"ח'
  board?: RouteBoard
  balloon?: RouteBalloon
  balloonMonths?: number
  amount: number
  years: number
  anchor: number
  margin: number
  changeMonths?: number
  indexType?: RouteIndexType
  indexPct?: number
  customAnnualIndex?: number
  dailyInterest?: boolean
  forceActualIndex?: boolean
  startDateOverride?: string
  exitFee?: number
  sharePct?: number
  loanPurpose?: 'housing' | 'allPurpose' | ''
  purposeSplit?: PurposeSplit | null
  useGeneralRate?: boolean
  /** internal recursion guard for purposeSplit — set by calcRoute itself, never by callers */
  _purposeSplitBypass?: boolean
}

export interface MonthlyIndex {
  month: string
  rate: number
}

/** the two-argument contract fixed by issue #3 folds everything calcRoute needs into params */
export interface Params {
  'ללא'?: number
  'מדד'?: number
  'דולר'?: number
  'אירו'?: number
  indexCalcMode?: 'annual' | 'monthly'
  monthlyIndices?: MonthlyIndex[]
  financialDate?: string
}

export interface RouteCalc {
  S: number
  T: number
  n: number
  L: number[]
  baseL: number[]
  basePrin: number[]
  indexBal: number[]
  M: number[]
  prin: number[]
  intr: number[]
  idxEff: number[]
  idxPrin: number[]
  idxIntr: number[]
  cum: number[]
  annualRate: number
  enteredAnnualRate: number
  invalidNegativeRate: boolean
  effRate: number
  annualIndex: number
}

export interface MixCalc {
  E: number
  exitFee: number
  totalAmount: number
  principal: number
  avgYears: number
  avgRate: number
  firstPay: number
  total: number
  interest: number
  indexation: number
  per: RouteCalc[]
  maxN: number
}