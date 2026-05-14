import { Criterion, EvaluationItem, CriterionState } from '@prisma/client'

export interface AdvanceResult {
  canAdvance: boolean
  reason?: 'blocker_not_started' | 'too_many_complementary_ni' | 'incomplete'
  blockerNI: number
  complementaryNI: number
  progress: number
}

export function calculateAdvance(
  criteria: Criterion[],
  items: EvaluationItem[]
): AdvanceResult {
  const getState = (criterionId: string): CriterionState | null => {
    return items.find(i => i.criterionId === criterionId)?.state ?? null
  }

  const allAnswered = criteria.every(c => getState(c.id) !== null)
  if (!allAnswered) {
    const progress = calculateProgress(criteria, items)
    return { canAdvance: false, reason: 'incomplete', blockerNI: 0, complementaryNI: 0, progress }
  }

  const blockers = criteria.filter(c => c.type === 'BLOCKER')
  const complementary = criteria.filter(c => c.type === 'COMPLEMENTARY')

  const blockerNI = blockers.filter(c => getState(c.id) === 'NOT_STARTED').length
  const complementaryNI = complementary.filter(c => getState(c.id) === 'NOT_STARTED').length

  const progress = calculateProgress(criteria, items)

  if (blockerNI > 0) {
    return { canAdvance: false, reason: 'blocker_not_started', blockerNI, complementaryNI, progress }
  }

  if (complementaryNI >= 3) {
    return { canAdvance: false, reason: 'too_many_complementary_ni', blockerNI, complementaryNI, progress }
  }

  return { canAdvance: true, blockerNI, complementaryNI, progress }
}

export function calculateProgress(
  criteria: Criterion[],
  items: EvaluationItem[]
): number {
  if (criteria.length === 0) return 0

  const score = criteria.reduce((acc, criterion) => {
    const item = items.find(i => i.criterionId === criterion.id)
    if (!item) return acc
    if (item.state === 'MASTERED') return acc + 1
    if (item.state === 'DEVELOPING') return acc + 0.5
    return acc
  }, 0)

  return Math.round((score / criteria.length) * 100)
}

export function getNextSublevel(currentId: string): string | null {
  const order = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C']
  const idx = order.indexOf(currentId)
  if (idx === -1 || idx === order.length - 1) return null
  return order[idx + 1]
}

export function getIntakeSublevelFromBlock(
  blockIndex: number,
  failedOnPartialItems: boolean = false
): string {
  const blockMap: Record<number, string[]> = {
    0: ['1A'],
    1: ['1B', '1C'],
    2: ['2A', '2B'],
    3: ['2C'],
    4: ['3A', '3B'],
    5: ['3C'],
  }
  const options = blockMap[blockIndex] ?? ['1A']
  return failedOnPartialItems && options.length > 1 ? options[1] : options[0]
}
