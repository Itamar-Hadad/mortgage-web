// Runs against the real Firestore Emulator — see package.json's test:firestore script.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { assignAdvisorInFirestore, getConfigFromFirestore, saveConfigToFirestore } from './adminFirestore'

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

beforeEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

// ── helpers ──────────────────────────────────────────────────────────────────

async function seedRequest(requestUid: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'requests', requestUid), data)
  })
}

async function readRequest(requestUid: string) {
  let data: Record<string, unknown> | undefined
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), 'requests', requestUid))
    data = snap.data()
  })
  return data
}

async function readConfig(configKey: string) {
  let data: Record<string, unknown> | undefined
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), 'config', configKey))
    data = snap.exists() ? snap.data() : undefined
  })
  return data
}

// ── assignAdvisorInFirestore ─────────────────────────────────────────────────

describe('assignAdvisorInFirestore', () => {
  it('sets assignedAdvisorUid on the request', async () => {
    await seedRequest('client1', { assignedAdvisorUid: null, archived: false })

    const adminDb = testEnv.authenticatedContext('admin-user', { role: 'admin' }).firestore()
    await assignAdvisorInFirestore(adminDb, 'client1', 'advisor-42')

    const saved = await readRequest('client1')
    expect(saved?.assignedAdvisorUid).toBe('advisor-42')
  })

  it('can unassign by passing null', async () => {
    await seedRequest('client2', { assignedAdvisorUid: 'advisor-1', archived: false })

    const adminDb = testEnv.authenticatedContext('admin-user', { role: 'admin' }).firestore()
    await assignAdvisorInFirestore(adminDb, 'client2', null)

    const saved = await readRequest('client2')
    expect(saved?.assignedAdvisorUid).toBeNull()
  })
})

// ── Firestore rules: admin role ──────────────────────────────────────────────

describe('Firestore rules — admin', () => {
  it('admin can read a request not assigned to them', async () => {
    await seedRequest('client-other', { assignedAdvisorUid: 'someone-else', archived: false })

    const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore()
    const snap = await getDoc(doc(adminDb, 'requests', 'client-other'))
    expect(snap.exists()).toBe(true)
  })

  it('advisor cannot read a request assigned to a different advisor', async () => {
    await seedRequest('client-other', { assignedAdvisorUid: 'advisor-a', archived: false })

    const otherAdvisorDb = testEnv.authenticatedContext('advisor-b', { role: 'advisor' }).firestore()
    await expect(getDoc(doc(otherAdvisorDb, 'requests', 'client-other'))).rejects.toThrow()
  })
})

// ── saveConfigToFirestore / getConfigFromFirestore ───────────────────────────

describe('saveConfigToFirestore / getConfigFromFirestore', () => {
  it('admin can write and read back a config document', async () => {
    const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore()
    const rates = { prime: 0.057, fixed25: 0.048 }

    await saveConfigToFirestore(adminDb, 'generalRates', rates)
    const saved = await readConfig('generalRates')
    expect(saved).toEqual(rates)
  })

  it('getConfigFromFirestore returns null when doc does not exist', async () => {
    const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore()
    const result = await getConfigFromFirestore(adminDb, 'nonexistent')
    expect(result).toBeNull()
  })

  it('getConfigFromFirestore returns saved value', async () => {
    const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore()
    const rules = [{ maxFloatPct: 30 }, { maxFloatPct: 50 }]

    await saveConfigToFirestore(adminDb, 'riskRules', { rules })
    const result = await getConfigFromFirestore<{ rules: typeof rules }>(adminDb, 'riskRules')
    expect(result?.rules).toEqual(rules)
  })

  it('non-admin cannot write config', async () => {
    const advisorDb = testEnv.authenticatedContext('advisor-uid', { role: 'advisor' }).firestore()
    await expect(saveConfigToFirestore(advisorDb, 'generalRates', { prime: 0.057 })).rejects.toThrow()
  })
})
