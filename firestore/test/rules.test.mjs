// Tests the repo-root firestore.rules against the real Firestore Emulator
// (assertSucceeds/assertFails), not app code — run via `npm test` in firestore/.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'simplesave-mortgage',
  firestore: {
    rules: readFileSync('../firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
})

async function seedRequest(requestId, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'requests', requestId), data)
  })
}

async function run() {
  await seedRequest('client1', { assignedAdvisorUid: 'advisor1' })

  const advisor1 = testEnv.authenticatedContext('advisor1', { role: 'advisor' })
  await assertSucceeds(getDoc(doc(advisor1.firestore(), 'requests', 'client1')))

  const advisor2 = testEnv.authenticatedContext('advisor2', { role: 'advisor' })
  await assertFails(getDoc(doc(advisor2.firestore(), 'requests', 'client1')))

  const anonymous = testEnv.unauthenticatedContext()
  await assertFails(getDoc(doc(anonymous.firestore(), 'requests', 'client1')))

  const consumerOwner = testEnv.authenticatedContext('client1', { role: 'consumer' })
  await assertFails(getDoc(doc(consumerOwner.firestore(), 'requests', 'client1')))

  await assertSucceeds(
    setDoc(doc(advisor1.firestore(), 'requests', 'client1'), { assignedAdvisorUid: 'advisor1', note: 'updated' }),
  )
  await assertFails(
    setDoc(doc(advisor2.firestore(), 'requests', 'client1'), { assignedAdvisorUid: 'advisor1', note: 'hijacked' }),
  )

  await assertSucceeds(
    addDoc(collection(advisor1.firestore(), 'tasks'), { advisorUid: 'advisor1', requestUid: null, text: 'בדוק תלוש', done: false }),
  )
  await assertFails(
    addDoc(collection(advisor1.firestore(), 'tasks'), { advisorUid: 'advisor2', requestUid: null, text: 'מתחזה', done: false }),
  )

  const ownTasksQuery = query(collection(advisor1.firestore(), 'tasks'), where('advisorUid', '==', 'advisor1'))
  await assertSucceeds(getDocs(ownTasksQuery))
  const othersTasksQuery = query(collection(advisor2.firestore(), 'tasks'), where('advisorUid', '==', 'advisor1'))
  await assertFails(getDocs(othersTasksQuery))

  console.log('All Firestore rules tests passed.')
  await testEnv.cleanup()
}

run().catch(async (err) => {
  console.error(err)
  await testEnv.cleanup()
  process.exit(1)
})