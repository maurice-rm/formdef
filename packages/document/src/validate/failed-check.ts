import type { Condition } from '../condition'
import type { Answers } from '../evaluate/answers'
import { holds } from '../evaluate/holds'
import type { Check } from '../form-document'

// Both sides of a comparison between two answers; one with a fixed value compares no other answer.
const comparedAnswerKeys = (condition: Condition): string[] => {
  if ('all' in condition) {
    return condition.all.flatMap(comparedAnswerKeys)
  }
  if ('any' in condition) {
    return condition.any.flatMap(comparedAnswerKeys)
  }
  return condition.valueFrom === undefined ? [] : [condition.field, condition.valueFrom]
}

const hasEveryAnswer = (check: Check, answers: Answers): boolean =>
  comparedAnswerKeys(check.when).every((key) => answers.get(key) !== undefined)

/**
 * The first check of a field whose condition does not hold for these answers. A check that
 * compares two answers, one of them not given yet, is skipped, since there is nothing to compare
 * yet; the field checked is filled when its checks run.
 */
export function failedCheck(
  checks: readonly Check[] | undefined,
  answers: Answers,
): Check | undefined {
  return checks?.find((check) => hasEveryAnswer(check, answers) && !holds(check.when, answers))
}
