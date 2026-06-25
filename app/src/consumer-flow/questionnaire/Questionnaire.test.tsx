import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../shared/i18n'
import he from '../../locales/he.json'
import { Questionnaire } from './Questionnaire'
import { DRAFT_STORAGE_KEY } from './types'

function renderQ() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Questionnaire />
    </I18nextProvider>,
  )
}

describe('Questionnaire wizard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('shows step progress on the first step', () => {
    renderQ()
    expect(screen.getByText('שלב 1 מתוך 6')).toBeInTheDocument()
  })

  test('validation blocks advancing when the step is incomplete', async () => {
    const user = userEvent.setup()
    renderQ()
    await user.click(screen.getByRole('button', { name: he.q.next }))
    expect(screen.getByRole('alert')).toHaveTextContent(he.q.errors.loan_purpose_required)
    // still on step 1
    expect(screen.getByText('שלב 1 מתוך 6')).toBeInTheDocument()
  })

  test('advances to the next step once the step is valid', async () => {
    const user = userEvent.setup()
    renderQ()
    await user.selectOptions(screen.getByLabelText(he.q.property.loan_purpose), 'נכס יחיד')
    await user.selectOptions(screen.getByLabelText(he.q.property.property_source), 'יד 2')
    await user.click(screen.getByRole('button', { name: he.q.next }))
    expect(screen.getByText('שלב 2 מתוך 6')).toBeInTheDocument()
  })

  test('autosaves answers to localStorage as the user fills the form', async () => {
    const user = userEvent.setup()
    renderQ()
    await user.selectOptions(screen.getByLabelText(he.q.property.loan_purpose), 'לכל מטרה')

    const stored = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) as string)
    expect(stored.loanPurpose).toBe('לכל מטרה')
  })

  test('reaching the end shows the done screen', async () => {
    const user = userEvent.setup()
    renderQ()

    // step 0: property
    await user.selectOptions(screen.getByLabelText(he.q.property.loan_purpose), 'נכס יחיד')
    await user.selectOptions(screen.getByLabelText(he.q.property.property_source), 'יד 2')
    await user.click(screen.getByRole('button', { name: he.q.next }))

    // step 1: value & equity (700k loan on 1M = 70% ≤ 75%)
    await user.type(screen.getByLabelText(he.q.value_equity.property_value), '1000000')
    await user.type(screen.getByLabelText(he.q.value_equity.equity), '300000')
    await user.click(screen.getByRole('button', { name: he.q.next }))

    // step 2: borrowers
    await user.type(screen.getByLabelText(`${he.q.borrowers.first} 1`), 'דנה')
    await user.type(screen.getByLabelText(`${he.q.borrowers.birth} 1`), '1990-01-01')
    await user.type(screen.getByLabelText(`${he.q.borrowers.income} 1`), '15000')
    await user.click(screen.getByRole('button', { name: he.q.next }))

    // step 3: additional income (optional)
    await user.click(screen.getByRole('button', { name: he.q.next }))

    // step 4: loans (optional)
    await user.click(screen.getByRole('button', { name: he.q.next }))

    // step 5: payment range
    await user.type(screen.getByLabelText(he.q.payment_range.max), '6000')
    await user.click(screen.getByRole('button', { name: he.q.finish }))

    expect(screen.getByRole('heading', { name: he.q.done_title })).toBeInTheDocument()
  })
})
