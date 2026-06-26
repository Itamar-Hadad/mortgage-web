import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../shared/i18n'

const signUpWithEmailMock = vi.fn()
const isNewUserMock = vi.fn()
const claimConsumerRoleMock = vi.fn()
const migrateDraftOnSignupMock = vi.fn()
const navigateMock = vi.fn()
const getIdTokenMock = vi.fn()

vi.mock('./authService', () => ({
  createRecaptchaVerifier: vi.fn(),
  sendPhoneOtp: vi.fn(),
  confirmPhoneOtp: vi.fn(),
  signUpWithEmail: (...args: unknown[]) => signUpWithEmailMock(...args),
  signInWithGoogle: vi.fn(),
  isNewUser: (...args: unknown[]) => isNewUserMock(...args),
  claimConsumerRole: (...args: unknown[]) => claimConsumerRoleMock(...args),
  firebaseErrorMessage: () => i18n.t('sign_up.error_generic'),
  normaliseIsraeliPhone: (raw: string) => raw,
}))

vi.mock('./migrateDraftOnSignup', () => ({
  migrateDraftOnSignup: (...args: unknown[]) => migrateDraftOnSignupMock(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

const { SignUpPage } = await import('./SignUpPage')

beforeEach(() => {
  signUpWithEmailMock.mockReset()
  isNewUserMock.mockReset()
  claimConsumerRoleMock.mockReset().mockResolvedValue(undefined)
  migrateDraftOnSignupMock.mockReset().mockResolvedValue(undefined)
  navigateMock.mockReset()
  getIdTokenMock.mockReset().mockResolvedValue('token')
})

function renderSignUp() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

test('new email signup migrates the draft, then claims the consumer role, then navigates', async () => {
  const credential = { user: { uid: 'uid-new', getIdToken: getIdTokenMock } }
  signUpWithEmailMock.mockResolvedValue(credential)
  isNewUserMock.mockReturnValue(true)

  renderSignUp()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.method_email') }))
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.email_label')), 'dana@example.com')
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.password_label')), 'super-secret')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.submit_email') }))

  expect(signUpWithEmailMock).toHaveBeenCalledWith('dana@example.com', 'super-secret')
  expect(migrateDraftOnSignupMock).toHaveBeenCalledWith('uid-new', true)
  expect(claimConsumerRoleMock).toHaveBeenCalledTimes(1)
  expect(getIdTokenMock).toHaveBeenCalledWith(true)
  expect(navigateMock).toHaveBeenCalledWith('/personal-area')

  // order matters: the role is only claimed once the draft has actually migrated
  const migrateOrder = migrateDraftOnSignupMock.mock.invocationCallOrder[0]
  const claimOrder = claimConsumerRoleMock.mock.invocationCallOrder[0]
  expect(migrateOrder).toBeLessThan(claimOrder)
})

test('returning email user still re-claims the role (idempotent self-heal) and navigates', async () => {
  // isNewUser only reflects whether the Auth account was just created — an
  // earlier attempt may have created the account but been interrupted before
  // claiming the role, so every retry must re-claim it regardless of this flag.
  const credential = { user: { uid: 'uid-returning', getIdToken: getIdTokenMock } }
  signUpWithEmailMock.mockResolvedValue(credential)
  isNewUserMock.mockReturnValue(false)

  renderSignUp()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.method_email') }))
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.email_label')), 'dana@example.com')
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.password_label')), 'super-secret')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.submit_email') }))

  expect(claimConsumerRoleMock).toHaveBeenCalledTimes(1)
  expect(migrateDraftOnSignupMock).toHaveBeenCalledWith('uid-returning', false)
  expect(navigateMock).toHaveBeenCalledWith('/personal-area')
})

test('a failed email signup shows the generic error and never migrates the draft or claims a role', async () => {
  signUpWithEmailMock.mockRejectedValue(new Error('auth/email-already-in-use'))

  renderSignUp()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.method_email') }))
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.email_label')), 'dana@example.com')
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.password_label')), 'super-secret')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.submit_email') }))

  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('sign_up.error_generic'))
  expect(migrateDraftOnSignupMock).not.toHaveBeenCalled()
  expect(claimConsumerRoleMock).not.toHaveBeenCalled()
  expect(navigateMock).not.toHaveBeenCalled()
})

test('a new user whose draft migration fails is never given the consumer role (no orphaned privileged account)', async () => {
  const credential = { user: { uid: 'uid-interrupted', getIdToken: getIdTokenMock } }
  signUpWithEmailMock.mockResolvedValue(credential)
  isNewUserMock.mockReturnValue(true)
  migrateDraftOnSignupMock.mockRejectedValue(new Error('network error'))

  renderSignUp()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.method_email') }))
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.email_label')), 'dana@example.com')
  await userEvent.type(screen.getByLabelText(i18n.t('sign_up.password_label')), 'super-secret')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_up.submit_email') }))

  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('sign_up.error_generic'))
  expect(claimConsumerRoleMock).not.toHaveBeenCalled()
  expect(navigateMock).not.toHaveBeenCalled()
})
