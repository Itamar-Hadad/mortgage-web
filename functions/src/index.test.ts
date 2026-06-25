import { test, expect, vi, beforeEach } from 'vitest'
import type { UserRecord } from 'firebase-functions/v1/auth'

const setCustomUserClaimsMock = vi.fn()

vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ setCustomUserClaims: setCustomUserClaimsMock }),
}))

const { handleUserCreate } = await import('./index')

beforeEach(() => {
  setCustomUserClaimsMock.mockReset()
})

test('a newly created Auth user is given the consumer role claim', async () => {
  await handleUserCreate({ uid: 'uid-1' } as UserRecord)

  expect(setCustomUserClaimsMock).toHaveBeenCalledWith('uid-1', { role: 'consumer' })
})
