import { httpsCallable } from 'firebase/functions'
import { functions } from '../shared/firebase'

export interface CreateAdvisorInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

const createAdvisorCallable = httpsCallable<CreateAdvisorInput, { uid: string }>(functions, 'createAdvisorCallable')

export async function createAdvisor(input: CreateAdvisorInput): Promise<{ uid: string }> {
  const result = await createAdvisorCallable(input)
  return result.data
}