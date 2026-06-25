import { test, expect, vi, beforeEach } from 'vitest'

const addDocMock = vi.fn()
const collectionMock = vi.fn((...args: unknown[]) => args)
const queryMock = vi.fn((...args: unknown[]) => args)
const orderByMock = vi.fn((...args: unknown[]) => args)
const onSnapshotMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'server-timestamp')

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}))

const { sendMessage, subscribeToMessages } = await import('./messages')

beforeEach(() => {
  addDocMock.mockReset()
  collectionMock.mockClear()
  queryMock.mockClear()
  orderByMock.mockClear()
  onSnapshotMock.mockReset()
})

test('sendMessage writes {sender, text, timestamp} to requests/{uid}/messages', async () => {
  await sendMessage({} as never, 'uid-1', 'consumer', 'שלום')

  expect(collectionMock).toHaveBeenCalledWith({}, 'requests', 'uid-1', 'messages')
  expect(addDocMock).toHaveBeenCalledWith(
    expect.anything(),
    { sender: 'consumer', text: 'שלום', timestamp: 'server-timestamp' },
  )
})

test('subscribeToMessages orders by timestamp ascending and maps snapshot docs', () => {
  const callback = vi.fn()
  const toDate = vi.fn(() => new Date('2024-01-01'))
  onSnapshotMock.mockImplementation((_query, onNext) => {
    onNext({
      docs: [
        { id: 'm1', data: () => ({ sender: 'consumer', text: 'הי', timestamp: { toDate } }) },
        { id: 'm2', data: () => ({ sender: 'advisor', text: 'שלום', timestamp: null }) },
      ],
    })
    return () => {}
  })

  subscribeToMessages({} as never, 'uid-1', callback)

  expect(orderByMock).toHaveBeenCalledWith('timestamp', 'asc')
  expect(callback).toHaveBeenCalledWith([
    { id: 'm1', sender: 'consumer', text: 'הי', timestamp: toDate() },
    { id: 'm2', sender: 'advisor', text: 'שלום', timestamp: null },
  ])
})
