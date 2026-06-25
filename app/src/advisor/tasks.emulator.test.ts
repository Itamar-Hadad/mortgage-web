// Runs against the real Firestore Emulator — see app/package.json's test:firestore script.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { addTask, listTasksForAdvisor } from './tasks'

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
})

describe('addTask', () => {
  it('creates a general task (no linked client) for the calling advisor', async () => {
    const advisorDb = testEnv.authenticatedContext('advisor1', { role: 'advisor' }).firestore()
    await addTask(advisorDb, 'advisor1', null, 'להתקשר לבנק לגבי ריבית')
  })
})

describe('listTasksForAdvisor', () => {
  it('returns only the calling advisor’s own tasks', async () => {
    const advisor1Db = testEnv.authenticatedContext('advisor1', { role: 'advisor' }).firestore()
    const advisor2Db = testEnv.authenticatedContext('advisor2', { role: 'advisor' }).firestore()

    await addTask(advisor1Db, 'advisor1', 'client1', 'לבדוק תלוש שכר')
    await addTask(advisor2Db, 'advisor2', null, 'משימה של יועץ אחר')

    const tasks = await listTasksForAdvisor(advisor1Db, 'advisor1')

    expect(tasks).toHaveLength(1)
    expect(tasks[0].text).toBe('לבדוק תלוש שכר')
    expect(tasks[0].requestUid).toBe('client1')
    expect(tasks[0].done).toBe(false)
  })
})