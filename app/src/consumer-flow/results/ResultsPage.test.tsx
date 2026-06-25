import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../shared/i18n'
import type { QuestionnaireDraft } from '../questionnaire/types'

const navigateMock = vi.fn()
const useCalcMixesMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('./useCalcMixes', () => ({
  useCalcMixes: (...args: unknown[]) => useCalcMixesMock(...args),
}))

const { ResultsPage } = await import('./ResultsPage')

const draft = {} as QuestionnaireDraft

function renderResults() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ResultsPage draft={draft} onRestart={vi.fn()} />
    </I18nextProvider>,
  )
}

beforeEach(() => {
  navigateMock.mockReset()
  useCalcMixesMock.mockReset().mockReturnValue({
    status: 'done',
    error: '',
    results: [
      {
        mix: { id: 't1', name: 'תמהיל מאוזן', routes: [], risk: 1, firstMonthlyPayment: 5000, totalPayment: 1200000, totalInterestAndIndexation: 200000 },
        calc: { firstPay: 5000, total: 1200000, interest: 150000, indexation: 50000, maxN: 240, per: [] },
        risk: { level: 1, label: 'נמוכה' },
      },
    ],
  })
})

test('selecting a mix opens the registration CTA, and the register button navigates to sign-up', async () => {
  const user = userEvent.setup()
  renderResults()

  await user.click(screen.getByRole('button', { name: i18n.t('results.btn_select') }))
  expect(screen.getByText(i18n.t('results.cta_title'))).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: i18n.t('results.cta_register') }))
  expect(navigateMock).toHaveBeenCalledWith('/sign-up')
})
