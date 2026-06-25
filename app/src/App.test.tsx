import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './shared/i18n'
import he from './locales/he.json'
import { AppRoutes } from './App'

function renderAt(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

test('consumer-flow route shows its translated placeholder text', () => {
  renderAt('/')
  expect(screen.getByText(he.placeholder.consumer_flow)).toBeInTheDocument()
})

test('personal-area route shows its translated placeholder text', () => {
  renderAt('/personal-area')
  expect(screen.getByText(he.placeholder.personal_area)).toBeInTheDocument()
})

test('admin-advisor route shows its translated placeholder text', () => {
  renderAt('/admin-advisor')
  expect(screen.getByText(he.placeholder.admin_advisor)).toBeInTheDocument()
})

test('clicking the personal-area nav link navigates there', async () => {
  renderAt('/')
  await userEvent.click(screen.getByRole('link', { name: he.nav.personal_area }))
  expect(screen.getByText(he.placeholder.personal_area)).toBeInTheDocument()
})