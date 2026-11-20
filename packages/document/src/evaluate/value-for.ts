import type { Condition } from '../condition'
import type { Answers } from './answers'
import { holds } from './holds'

/**
 * The value of something that follows an answer, for these answers: the value of the first case
 * whose condition holds, otherwise the fallback.
 */
export function valueFor<TValue>(
  following: { cases: readonly { when: Condition; value: TValue }[]; otherwise: TValue },
  answers: Answers,
): TValue {
  const applying = following.cases.find((entry) => holds(entry.when, answers))
  return applying === undefined ? following.otherwise : applying.value
}
