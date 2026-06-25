import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const sendMessageMock = vi.fn()
const subscribeToMessagesMock = vi.fn()

vi.mock('../messages', () => ({
  sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  subscribeToMessages: (...args: unknown[]) => subscribeToMessagesMock(...args),
}))
vi.mock('../../shared/firebase', () => ({ db: {} }))

const { MessagesSection } = await import('./MessagesSection')

beforeEach(() => {
  sendMessageMock.mockReset().mockResolvedValue(undefined)
  subscribeToMessagesMock.mockReset().mockImplementation((_db, _uid, callback) => {
    callback([])
    return () => {}
  })
})

describe('MessagesSection', () => {
  it('renders messages from the subscription, distinguishing consumer from advisor', () => {
    subscribeToMessagesMock.mockImplementation((_db, _uid, callback) => {
      callback([
        { id: 'm1', sender: 'consumer', text: 'יש לי שאלה', timestamp: new Date() },
        { id: 'm2', sender: 'advisor', text: 'איך אפשר לעזור?', timestamp: new Date() },
      ])
      return () => {}
    })

    render(<MessagesSection uid="uid-1" />)

    expect(screen.getByText('יש לי שאלה')).toBeInTheDocument()
    expect(screen.getByText('איך אפשר לעזור?')).toBeInTheDocument()
  })

  it('sends a message as the consumer and clears the input', async () => {
    const user = userEvent.setup()
    render(<MessagesSection uid="uid-1" />)

    const input = screen.getByLabelText('כתבו הודעה')
    await user.type(input, 'שאלה לגבי המסמכים')
    await user.click(screen.getByRole('button', { name: /שליחה/ }))

    expect(sendMessageMock).toHaveBeenCalledWith({}, 'uid-1', 'consumer', 'שאלה לגבי המסמכים')
    expect(input).toHaveValue('')
  })

  it('does not send an empty/whitespace-only message', async () => {
    const user = userEvent.setup()
    render(<MessagesSection uid="uid-1" />)

    await user.type(screen.getByLabelText('כתבו הודעה'), '   ')
    expect(screen.getByRole('button', { name: /שליחה/ })).toBeDisabled()
    expect(sendMessageMock).not.toHaveBeenCalled()
  })
})
