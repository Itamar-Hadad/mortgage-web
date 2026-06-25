import type { QuestionnaireDraft } from '../types'

/** Common props every wizard step receives from the container. */
export interface StepProps {
  draft: QuestionnaireDraft
  update: (patch: Partial<QuestionnaireDraft>) => void
}

/** Parse a number input value into the `number | ''` field convention. */
export function toNum(value: string): number | '' {
  if (value.trim() === '') return ''
  const n = Number(value)
  return Number.isFinite(n) ? n : ''
}
