import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import i18n from '../shared/i18n'
import { MixEditor } from './MixEditor'
import type { MixRoute } from '../consumer-flow/questionnaire/types'

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

function route(overrides: Partial<MixRoute> = {}): MixRoute {
  return {
    kind: 'fixed',
    sharePct: 100,
    amount: 500000,
    years: 20,
    board: 'שפיצר',
    indexType: 'ללא',
    anchor: 0.05,
    margin: 0,
    ...overrides,
  }
}

describe('MixEditor', () => {
  it('recalculates the first monthly payment immediately when the amount changes, with no network/loading state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const routes = [route()]

    const { rerender } = renderWithI18n(<MixEditor routes={routes} onChange={onChange} />)

    const before = screen.getByTestId('first-payment').textContent

    const amountInput = screen.getByLabelText(i18n.t('advisor.mix_editor.route_amount'))
    await user.clear(amountInput)
    await user.type(amountInput, '900000')

    const newRoutes = onChange.mock.calls.at(-1)?.[0]
    rerender(
      <I18nextProvider i18n={i18n}>
        <MixEditor routes={newRoutes} onChange={onChange} />
      </I18nextProvider>,
    )

    expect(screen.getByTestId('first-payment').textContent).not.toBe(before)
  })

  it('shows the mix risk label computed from the routes', () => {
    renderWithI18n(<MixEditor routes={[route({ kind: 'fixed', years: 25 })]} onChange={vi.fn()} />)
    expect(screen.getByTestId('risk-label').textContent).toBe('גבוהה')
  })
})