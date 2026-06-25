import { test, expect } from 'vitest'
import { PMT } from './pmt'

test('PMT produces a payment that fully amortizes the loan to zero over n periods', () => {
  const r = 0.01,
    n = 12,
    pv = 1000
  const payment = -PMT(r, n, pv)
  let balance = pv
  for (let i = 0; i < n; i++) {
    balance = balance * (1 + r) - payment
  }
  expect(balance).toBeCloseTo(0, 6)
})