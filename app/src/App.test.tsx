import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

test('home route shows the questionnaire title', () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: he.q.title })).toBeInTheDocument()
})

test('personal-area route shows its translated placeholder text', () => {
  renderAt('/personal-area')
  expect(screen.getByText(he.placeholder.personal_area)).toBeInTheDocument()
})

test('admin-advisor route shows its translated placeholder text', () => {
  renderAt('/admin-advisor')
  expect(screen.getByText(he.placeholder.admin_advisor)).toBeInTheDocument()
})