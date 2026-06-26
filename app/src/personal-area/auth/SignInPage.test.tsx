import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../shared/i18n'

const signInWithEmailMock = vi.fn()
const getUserRoleMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('./authService', () => ({
  signInWithEmail: (...args: unknown[]) => signInWithEmailMock(...args),
  signInWithGoogle: vi.fn(),
  isNewUser: vi.fn(),
  claimConsumerRole: vi.fn(),
  getUserRole: (...args: unknown[]) => getUserRoleMock(...args),
  firebaseErrorMessage: () => i18n.t('sign_in.error_generic'),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

const { SignInPage } = await import('./SignInPage')

beforeEach(() => {
  signInWithEmailMock.mockReset()
  getUserRoleMock.mockReset().mockResolvedValue(null)
  navigateMock.mockReset()
})

function renderSignIn() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

test('a successful sign-in navigates to the personal area without touching the draft migration', async () => {
  signInWithEmailMock.mockResolvedValue({ user: { uid: 'uid-returning' } })

  renderSignIn()
  await userEvent.type(screen.getByLabelText(i18n.t('sign_in.email_label')), 'dana@example.com')
  await userEvent.type(screen.getByLabelText(i18n.t('sign_in.password_label')), 'super-secret')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_in.submit') }))

  expect(signInWithEmailMock).toHaveBeenCalledWith('dana@example.com', 'super-secret')
  expect(navigateMock).toHaveBeenCalledWith('/personal-area')
})

test('a failed sign-in shows the generic error and does not navigate', async () => {
  signInWithEmailMock.mockRejectedValue(new Error('auth/wrong-password'))

  renderSignIn()
  await userEvent.type(screen.getByLabelText(i18n.t('sign_in.email_label')), 'dana@example.com')
  await userEvent.type(screen.getByLabelText(i18n.t('sign_in.password_label')), 'wrong')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('sign_in.submit') }))

  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('sign_in.error_generic'))
  expect(navigateMock).not.toHaveBeenCalled()
})
