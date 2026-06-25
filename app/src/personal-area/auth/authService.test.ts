import { test, expect, vi, beforeEach } from 'vitest'
import type { UserCredential } from 'firebase/auth'

const getAdditionalUserInfoMock = vi.fn()
const claimCallableMock = vi.fn()
const httpsCallableMock = vi.fn((..._args: unknown[]) => claimCallableMock)

vi.mock('../../shared/firebase', () => ({ auth: {}, functions: {} }))
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth')
  return { ...actual, getAdditionalUserInfo: (...args: unknown[]) => getAdditionalUserInfoMock(...args) }
})
vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}))

const { isNewUser, claimConsumerRole } = await import('./authService')

function credentialWithIsNewUser(isNewUserValue: boolean): UserCredential {
  getAdditionalUserInfoMock.mockReturnValueOnce({ isNewUser: isNewUserValue })
  return {} as UserCredential
}

test('isNewUser reflects additionalUserInfo.isNewUser', () => {
  expect(isNewUser(credentialWithIsNewUser(true))).toBe(true)
  expect(isNewUser(credentialWithIsNewUser(false))).toBe(false)
})

test('isNewUser defaults to false when additionalUserInfo is missing', () => {
  getAdditionalUserInfoMock.mockReturnValueOnce(null)
  expect(isNewUser({} as UserCredential)).toBe(false)
})

test('claimConsumerRole invokes the claimConsumerRoleOnRegistration callable', async () => {
  await claimConsumerRole()
  expect(claimCallableMock).toHaveBeenCalledTimes(1)
})

beforeEach(() => {
  getAdditionalUserInfoMock.mockReset()
  claimCallableMock.mockReset().mockResolvedValue(undefined)
})
