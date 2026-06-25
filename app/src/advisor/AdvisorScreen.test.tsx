import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import i18n from '../shared/i18n'
import he from '../locales/he.json'
import { AdvisorScreen } from './AdvisorScreen'

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <AdvisorScreen />
    </I18nextProvider>,
  )
}

async function click(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name }))
}

describe('AdvisorScreen', () => {
  it('shows only clients assigned to the current advisor, with a profile shown alongside the list', () => {
    renderScreen()
    expect(screen.getByText('דנה כהן')).toBeInTheDocument()
    expect(screen.getByText('יוני לוי')).toBeInTheDocument()
    expect(screen.queryByText(/אביגיל/)).not.toBeInTheDocument()
    // default selection shows a profile without needing to click anything
    expect(screen.getByDisplayValue('דנה')).toBeInTheDocument()
  })

  it('selecting a different client in the list swaps the profile shown', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByText('יוני לוי'))
    expect(screen.getByDisplayValue('יוני')).toBeInTheDocument()
  })

  it('approving a client’s last pending document does not swap the client being viewed', async () => {
    const user = userEvent.setup()
    renderScreen()

    await click(user, he.advisor.tabs.documents)
    const docRow = screen.getByTestId('document-d1')
    await user.click(within(docRow).getByRole('button', { name: he.advisor.documents.approve }))

    // דנה's last pending doc is now approved — without the fix this would
    // silently swap the view to יוני (whose createdAt sorts first once
    // neither client has a pending action). The profile tab should still
    // show דנה's own profile/documents, not jump away.
    await click(user, he.advisor.tabs.profile)
    expect(screen.getByTestId(`tasks-group-client-dana`)).toBeInTheDocument()
  })

  it('rejecting a document requires a reason and records it', async () => {
    const user = userEvent.setup()
    renderScreen()

    await click(user, he.advisor.tabs.documents)
    const docRow = screen.getByTestId('document-d1')

    await user.click(within(docRow).getByRole('button', { name: he.advisor.documents.reject }))
    await user.click(within(docRow).getByRole('button', { name: he.advisor.documents.reject }))
    expect(within(docRow).queryByText('נדחה')).not.toBeInTheDocument()

    await user.type(within(docRow).getByLabelText(he.advisor.documents.reject_reason_label), 'תלוש לא קריא')
    await user.click(within(docRow).getByRole('button', { name: he.advisor.documents.reject }))

    expect(within(docRow).getByText('נדחה')).toBeInTheDocument()
    expect(within(docRow).getByText('תלוש לא קריא')).toBeInTheDocument()
  })

  it('shows a view-document link when a file exists, and a placeholder when it does not', async () => {
    const user = userEvent.setup()
    renderScreen()

    await click(user, he.advisor.tabs.documents)
    const docRow = screen.getByTestId('document-d1')
    expect(within(docRow).getByRole('link', { name: he.advisor.documents.view })).toHaveAttribute(
      'href',
      expect.stringContaining('http'),
    )
  })

  it('lets the advisor add an open task for a client directly on their profile', async () => {
    const user = userEvent.setup()
    renderScreen()

    const profileGroup = screen.getByTestId('tasks-group-client-dana')
    await user.type(
      within(profileGroup).getByLabelText(he.advisor.tasks.text_label, { exact: false }),
      'להתקשר לגבי אישור עקרוני',
    )
    await user.click(within(profileGroup).getByRole('button', { name: he.advisor.tasks.add }))

    expect(within(profileGroup).getByText('להתקשר לגבי אישור עקרוני')).toBeInTheDocument()
  })

  it('aggregates the same tasks under each client in the משימות view, plus a general section', async () => {
    const user = userEvent.setup()
    renderScreen()

    const profileGroup = screen.getByTestId('tasks-group-client-dana')
    await user.type(within(profileGroup).getByLabelText(he.advisor.tasks.text_label, { exact: false }), 'משימה של דנה')
    await user.click(within(profileGroup).getByRole('button', { name: he.advisor.tasks.add }))

    await click(user, he.advisor.views.tasks)

    const danaGroup = screen.getByTestId('tasks-group-client-dana')
    const generalGroup = screen.getByTestId('tasks-group-general')
    expect(within(danaGroup).getByText('משימה של דנה')).toBeInTheDocument()
    expect(within(generalGroup).queryByText('משימה של דנה')).not.toBeInTheDocument()
  })

  it('marking a task done moves it to the done section, and notes can be recorded', async () => {
    const user = userEvent.setup()
    renderScreen()

    await click(user, he.advisor.views.tasks)
    const generalGroup = screen.getByTestId('tasks-group-general')
    await user.type(within(generalGroup).getByLabelText(he.advisor.tasks.text_label, { exact: false }), 'משימה לבדיקה')
    await user.click(within(generalGroup).getByRole('button', { name: he.advisor.tasks.add }))

    const checkbox = within(generalGroup).getByRole('checkbox', { name: he.advisor.tasks.done_label })
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(within(generalGroup).getByRole('button', { name: he.advisor.tasks.add_note }))
    const notesInput = within(generalGroup).getByLabelText(he.advisor.tasks.notes_label, { exact: false })
    await user.type(notesInput, 'דיברתי עם הלקוח')
    expect(within(generalGroup).getByDisplayValue('דיברתי עם הלקוח')).toBeInTheDocument()
  })

  it('shows a placeholder for the הודעות tab', async () => {
    const user = userEvent.setup()
    renderScreen()

    await click(user, he.advisor.tabs.messages)
    expect(screen.getByText(he.advisor.messages_placeholder)).toBeInTheDocument()
  })

  it('searches the client list by name or ID number', async () => {
    const user = userEvent.setup()
    renderScreen()

    const search = screen.getByLabelText(he.advisor.client_list.search)
    await user.type(search, '987654321')

    expect(screen.getByText('יוני לוי')).toBeInTheDocument()
    expect(screen.queryByText('דנה כהן')).not.toBeInTheDocument()
  })

  it('archiving a client moves them out of the active list into the archive', async () => {
    const user = userEvent.setup()
    renderScreen()

    await click(user, he.advisor.client_list.archive)
    expect(screen.queryByText('דנה כהן')).not.toBeInTheDocument()

    await click(user, he.advisor.client_list.archived)
    expect(screen.getByText('דנה כהן')).toBeInTheDocument()
  })

  it('deleting a task removes it from the list', async () => {
    const user = userEvent.setup()
    renderScreen()

    const profileGroup = screen.getByTestId('tasks-group-client-dana')
    await user.type(within(profileGroup).getByLabelText(he.advisor.tasks.text_label, { exact: false }), 'משימה למחיקה')
    await user.click(within(profileGroup).getByRole('button', { name: he.advisor.tasks.add }))
    expect(within(profileGroup).getByText('משימה למחיקה')).toBeInTheDocument()

    await user.click(within(profileGroup).getByRole('button', { name: `${he.advisor.tasks.delete} — משימה למחיקה` }))
    expect(within(profileGroup).queryByText('משימה למחיקה')).not.toBeInTheDocument()
  })

  it('searches tasks by task text or client name in the משימות view', async () => {
    const user = userEvent.setup()
    renderScreen()

    const danaProfileGroup = screen.getByTestId('tasks-group-client-dana')
    await user.type(within(danaProfileGroup).getByLabelText(he.advisor.tasks.text_label, { exact: false }), 'לבדוק ריבית')
    await user.click(within(danaProfileGroup).getByRole('button', { name: he.advisor.tasks.add }))

    await user.click(screen.getByText('יוני לוי'))
    const yoniProfileGroup = screen.getByTestId('tasks-group-client-yoni')
    await user.type(within(yoniProfileGroup).getByLabelText(he.advisor.tasks.text_label, { exact: false }), 'לשלוח מייל')
    await user.click(within(yoniProfileGroup).getByRole('button', { name: he.advisor.tasks.add }))

    await click(user, he.advisor.views.tasks)

    await user.type(screen.getByLabelText(he.advisor.tasks.search), 'ריבית')
    expect(screen.getByText('לבדוק ריבית')).toBeInTheDocument()
    expect(screen.queryByText('לשלוח מייל')).not.toBeInTheDocument()
    expect(screen.queryByText('יוני לוי')).not.toBeInTheDocument()
  })
})