import { test, expect, vi, beforeEach } from 'vitest'
import type { CallableRequest } from 'firebase-functions/v2/https'

const setCustomUserClaimsMock = vi.fn()
const createUserMock = vi.fn()
const setMock = vi.fn()
const docMock = vi.fn(() => ({ set: setMock }))

vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ setCustomUserClaims: setCustomUserClaimsMock, createUser: createUserMock }),
}))
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ doc: docMock }),
}))

const { createAdvisor } = await import('./createAdvisor')

function adminRequest(data: unknown): CallableRequest {
  return { auth: { uid: 'admin-1', token: { role: 'admin' } }, data } as unknown as CallableRequest
}

beforeEach(() => {
  setCustomUserClaimsMock.mockReset()
  createUserMock.mockReset().mockResolvedValue({ uid: 'new-advisor-uid' })
  setMock.mockReset().mockResolvedValue(undefined)
  docMock.mockClear()
})

test('an admin caller creates the advisor Auth account, claims the advisor role, and writes the advisors/{uid} record', async () => {
  await createAdvisor(adminRequest({
    firstName: 'דנה',
    lastName: 'כהן',
    email: 'dana@example.com',
    password: 'super-secret',
  }))

  expect(createUserMock).toHaveBeenCalledWith({ email: 'dana@example.com', password: 'super-secret' })
  expect(setCustomUserClaimsMock).toHaveBeenCalledWith('new-advisor-uid', { role: 'advisor' })
  expect(docMock).toHaveBeenCalledWith('advisors/new-advisor-uid')
  expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
    uid: 'new-advisor-uid',
    firstName: 'דנה',
    lastName: 'כהן',
    email: 'dana@example.com',
  }))
})

test('an unauthenticated call is rejected and creates nothing', async () => {
  await expect(createAdvisor({ auth: undefined, data: {} } as unknown as CallableRequest)).rejects.toThrow()

  expect(createUserMock).not.toHaveBeenCalled()
  expect(setCustomUserClaimsMock).not.toHaveBeenCalled()
  expect(setMock).not.toHaveBeenCalled()
})

test('missing required fields are rejected with a clear error before touching Auth or Firestore', async () => {
  await expect(createAdvisor(adminRequest({ firstName: '', lastName: '', email: '', password: '' })))
    .rejects.toThrow()

  expect(createUserMock).not.toHaveBeenCalled()
  expect(setCustomUserClaimsMock).not.toHaveBeenCalled()
  expect(setMock).not.toHaveBeenCalled()
})

test('a non-admin caller (e.g. consumer or advisor) is rejected and creates nothing', async () => {
  const nonAdminRequest = { auth: { uid: 'someone', token: { role: 'consumer' } }, data: {} } as unknown as CallableRequest

  await expect(createAdvisor(nonAdminRequest)).rejects.toThrow()

  expect(createUserMock).not.toHaveBeenCalled()
  expect(setCustomUserClaimsMock).not.toHaveBeenCalled()
  expect(setMock).not.toHaveBeenCalled()
})