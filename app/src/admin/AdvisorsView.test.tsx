import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../shared/i18n'
import type { Advisor } from '../advisor/types'

const createAdvisorMock = vi.fn()

vi.mock('./adminAuth', () => ({
  createAdvisor: (...args: unknown[]) => createAdvisorMock(...args),
}))

const { AdvisorsView } = await import('./AdvisorsView')

beforeEach(() => {
  createAdvisorMock.mockReset().mockResolvedValue({ uid: 'new-advisor-uid' })
})

function renderView(advisors: Advisor[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AdvisorsView advisors={advisors} />
    </I18nextProvider>,
  )
}

test('renders the advisors passed in', () => {
  renderView([
    { uid: 'a1', firstName: 'דנה', lastName: 'כהן', email: 'dana@example.com' },
    { uid: 'a2', firstName: 'יוני', lastName: 'לוי', email: 'yoni@example.com' },
  ])

  expect(screen.getByText('דנה כהן')).toBeInTheDocument()
  expect(screen.getByText('yoni@example.com')).toBeInTheDocument()
})

test('submitting the add-advisor form calls createAdvisor with the entered details', async () => {
  const user = userEvent.setup()
  renderView([])

  await user.click(screen.getByRole('button', { name: i18n.t('admin.advisors.add') }))
  await user.type(screen.getByLabelText(i18n.t('admin.advisors.first_name')), 'אביגיל')
  await user.type(screen.getByLabelText(i18n.t('admin.advisors.last_name')), 'מזרחי')
  await user.type(screen.getByLabelText(i18n.t('admin.advisors.email')), 'avigail@example.com')
  await user.type(screen.getByLabelText(i18n.t('admin.advisors.password')), 'super-secret')
  await user.click(screen.getByRole('button', { name: i18n.t('admin.advisors.submit') }))

  expect(createAdvisorMock).toHaveBeenCalledWith({
    firstName: 'אביגיל',
    lastName: 'מזרחי',
    email: 'avigail@example.com',
    password: 'super-secret',
  })
})