import type { Params } from '../calc-engine'

// Index/CPI assumptions — same defaults used in functions/test/calcEngine.emulator.test.mjs.
// Once issue #11 builds the admin-managed market-rate config, these come from
// Firestore instead (see calc-engine/README.md's useGeneralRate extension seam).
export function defaultCalcParams(): Params {
  return { ללא: 0, מדד: 0.03, דולר: 0.03, אירו: 0.015, indexCalcMode: 'annual' }
}