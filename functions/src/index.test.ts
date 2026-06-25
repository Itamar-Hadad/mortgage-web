import { test, expect, vi, beforeEach } from 'vitest'
import type { CallableRequest } from 'firebase-functions/v2/https'

const setCustomUserClaimsMock = vi.fn()

vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ setCustomUserClaims: setCustomUserClaimsMock }),
}))

const { claimConsumerRole } = await import('./index')

beforeEach(() => {
  setCustomUserClaimsMock.mockReset()
})

test('an authenticated caller is given the consumer role claim', async () => {
  await claimConsumerRole({ auth: { uid: 'uid-1' } } as CallableRequest)

  expect(setCustomUserClaimsMock).toHaveBeenCalledWith('uid-1', { role: 'consumer' })
})

test('an unauthenticated call is rejected and never grants a claim', async () => {
  await expect(claimConsumerRole({ auth: undefined } as CallableRequest)).rejects.toThrow()

  expect(setCustomUserClaimsMock).not.toHaveBeenCalled()
})
