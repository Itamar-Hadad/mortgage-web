// Runs against the real Firestore Emulator — see app/package.json's test:firestore script.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { sendMessage, subscribeToMessages } from './messages'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'simplesave-mortgage',
    firestore: {
      rules: readFileSync('../firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'requests', 'client1'), { assignedAdvisorUid: 'advisor1' })
  })
})

describe('sendMessage', () => {
  it('lets the owning consumer post a message to their own request', async () => {
    const ownerDb = testEnv.authenticatedContext('client1', { role: 'consumer' }).firestore()
    await sendMessage(ownerDb, 'client1', 'consumer', 'יש לי שאלה על המסמכים')
  })

  it('rejects a different consumer posting into someone else’s request', async () => {
    const otherDb = testEnv.authenticatedContext('someoneElse', { role: 'consumer' }).firestore()
    await expect(sendMessage(otherDb, 'client1', 'consumer', 'מתחזה')).rejects.toThrow()
  })

  it('lets the assigned advisor respond in the same thread', async () => {
    const advisorDb = testEnv.authenticatedContext('advisor1', { role: 'advisor' }).firestore()
    await sendMessage(advisorDb, 'client1', 'advisor', 'איך אפשר לעזור?')
  })

  it('rejects an unassigned advisor', async () => {
    const otherAdvisorDb = testEnv.authenticatedContext('advisor2', { role: 'advisor' }).firestore()
    await expect(sendMessage(otherAdvisorDb, 'client1', 'advisor', 'יועץ לא משויך')).rejects.toThrow()
  })
})

describe('subscribeToMessages', () => {
  it('delivers messages from both sides, in order, to the owning consumer', async () => {
    const ownerDb = testEnv.authenticatedContext('client1', { role: 'consumer' }).firestore()
    const advisorDb = testEnv.authenticatedContext('advisor1', { role: 'advisor' }).firestore()

    await sendMessage(ownerDb, 'client1', 'consumer', 'שאלה ראשונה')
    await sendMessage(advisorDb, 'client1', 'advisor', 'תשובה')

    const received = await new Promise<{ sender: string; text: string }[]>((resolve) => {
      const unsubscribe = subscribeToMessages(ownerDb, 'client1', (messages) => {
        if (messages.length === 2) {
          unsubscribe()
          resolve(messages.map((m) => ({ sender: m.sender, text: m.text })))
        }
      })
    })

    expect(received).toEqual([
      { sender: 'consumer', text: 'שאלה ראשונה' },
      { sender: 'advisor', text: 'תשובה' },
    ])
  })
})
