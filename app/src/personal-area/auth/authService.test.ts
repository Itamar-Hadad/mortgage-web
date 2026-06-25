import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import type { User, UserCredential } from 'firebase/auth'

const getAdditionalUserInfoMock = vi.fn()

vi.mock('../../shared/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth')
  return { ...actual, getAdditionalUserInfo: (...args: unknown[]) => getAdditionalUserInfoMock(...args) }
})

const { isNewUser, waitForRoleClaim } = await import('./authService')

function credentialWithIsNewUser(isNewUserValue: boolean): UserCredential {
  getAdditionalUserInfoMock.mockReturnValueOnce({ isNewUser: isNewUserValue })
  return {} as UserCredential
}

function userWithRoleSequence(roles: Array<string | undefined>): User {
  const getIdTokenResult = vi.fn()
  for (const role of roles) {
    getIdTokenResult.mockResolvedValueOnce({ claims: { role } })
  }
  return { getIdTokenResult } as unknown as User
}

test('isNewUser reflects additionalUserInfo.isNewUser', () => {
  expect(isNewUser(credentialWithIsNewUser(true))).toBe(true)
  expect(isNewUser(credentialWithIsNewUser(false))).toBe(false)
})

test('isNewUser defaults to false when additionalUserInfo is missing', () => {
  getAdditionalUserInfoMock.mockReturnValueOnce(null)
  expect(isNewUser({} as UserCredential)).toBe(false)
})

test('waitForRoleClaim returns the role as soon as the token carries it', async () => {
  const user = userWithRoleSequence([undefined, 'consumer'])
  vi.useFakeTimers()
  const result = waitForRoleClaim(user)
  await vi.advanceTimersByTimeAsync(500)
  expect(await result).toBe('consumer')
  expect(user.getIdTokenResult).toHaveBeenCalledTimes(2)
  expect(user.getIdTokenResult).toHaveBeenCalledWith(true)
  vi.useRealTimers()
})

test('waitForRoleClaim gives up after the retry budget and returns undefined', async () => {
  const user = userWithRoleSequence([undefined, undefined, undefined, undefined, undefined])
  vi.useFakeTimers()
  const result = waitForRoleClaim(user)
  await vi.advanceTimersByTimeAsync(2500)
  expect(await result).toBeUndefined()
  expect(user.getIdTokenResult).toHaveBeenCalledTimes(5)
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  getAdditionalUserInfoMock.mockReset()
})
