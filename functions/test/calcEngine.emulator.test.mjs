// Calls the deployed-shape callables through the Firebase Emulator Suite —
// i.e. over the same client SDK a real screen would use — not the internal
// calcRoute/calcMix functions directly. Run via `npm test` in functions/.
import assert from 'node:assert/strict'
import { initializeApp } from 'firebase/app'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'

const app = initializeApp({ projectId: 'simplesave-mortgage' })
const functions = getFunctions(app)
connectFunctionsEmulator(functions, '127.0.0.1', 5001)

const params = { ללא: 0, מדד: 0.03, דולר: 0.03, אירו: 0.015 }

function route(amount, years, anchor, extra = {}) {
  return {
    kind: 'fixed',
    sharePct: 0,
    years,
    amount,
    board: 'שפיצר',
    balloon: '',
    balloonMonths: 0,
    rateType: 'קבועה',
    changeMonths: 0,
    indexType: '',
    indexPct: 1,
    anchorType: '',
    anchor,
    margin: 0,
    ...extra,
  }
}

// same t1 mix as exampleState() in the original simulator (see calc-engine tests)
const t1 = [
  route(580000, 20, 0.0462, { kind: 'fixed', sharePct: 34, rateType: 'קבועה' }),
  route(650000, 30, 0.047, { kind: 'variable', sharePct: 38, rateType: 'משתנה', changeMonths: 60 }),
  route(470000, 27, 0.0456, { kind: 'prime', sharePct: 28, rateType: 'משתנה', anchorType: 'פריים', changeMonths: 1, indexType: 'ללא' }),
]

async function run() {
  const calcRouteCallable = httpsCallable(functions, 'calcRouteCallable')
  const routeResult = await calcRouteCallable({ route: t1[0], params })
  assert.ok(Math.abs(routeResult.data.S - 3707.0422803803085) < 1e-4, `calcRouteCallable S mismatch: ${routeResult.data.S}`)
  assert.equal(routeResult.data.n, 240)

  const calcMixCallable = httpsCallable(functions, 'calcMixCallable')
  const mixResult = await calcMixCallable({ routes: t1, params })
  assert.ok(Math.abs(mixResult.data.firstPay - 9603.012327983832) < 1e-3, `calcMixCallable firstPay mismatch: ${mixResult.data.firstPay}`)
  assert.equal(mixResult.data.maxN, 360)

  const mixRiskCallable = httpsCallable(functions, 'mixRiskCallable')
  const riskResult = await mixRiskCallable({ routes: t1 })
  assert.deepEqual(riskResult.data, { score: 2.44, level: 2, label: 'בינונית' })

  await assert.rejects(
    calcMixCallable({ params }), // missing routes
    (err) => err.code === 'functions/invalid-argument',
  )

  console.log('All Cloud Function emulator tests passed.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})