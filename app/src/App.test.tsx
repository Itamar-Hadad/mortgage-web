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

test('home route shows the landing page (ADR-0007), not the questionnaire', () => {
  renderAt('/')
  // HomePage hero + staff-login affordance, brand visible
  expect(screen.getAllByAltText('SimpleSave').length).toBeGreaterThan(0)
  expect(screen.getByText('כניסת צוות')).toBeInTheDocument()
  // the questionnaire lives at /questionnaire now, not at /
  expect(
    screen.queryByRole('heading', { name: he.q.title }),
  ).not.toBeInTheDocument()
})

test('questionnaire route shows the questionnaire title', () => {
  renderAt('/questionnaire')
  expect(screen.getByRole('heading', { name: he.q.title })).toBeInTheDocument()
})

test('admin route redirects to staff sign-in when unauthenticated (RequireRole)', () => {
  renderAt('/admin')
  // guard denies (no auth.currentUser in tests) → Navigate to /staff-sign-in
  expect(screen.getByText('כניסת צוות')).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: he.admin.title }),
  ).not.toBeInTheDocument()
})

test('advisor route redirects to staff sign-in when unauthenticated (RequireRole)', () => {
  renderAt('/advisor')
  expect(screen.getByText('כניסת צוות')).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: he.advisor.title }),
  ).not.toBeInTheDocument()
})
