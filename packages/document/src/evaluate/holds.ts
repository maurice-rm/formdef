import type { Comparison, Condition } from '../condition'
import { operatorOf } from '../kinds/operator-of'
import type { Answers } from './answers'

const holdsComparison = ({ field, op, value }: Comparison, answers: Answers): boolean => {
  const valueType = answers.valueTypeOf(field)
  const operator = valueType === undefined ? undefined : operatorOf(valueType, op)
  return operator?.holds(answers.get(field)?.value, value) === true
}

/**
 * Whether a condition holds for these answers, by the operators of the compared fields' value
 * types. A field without an answer is empty; a comparison by an operator its field's value type
 * does not have holds for nothing, as {@link checkDocument} reports it beforehand.
 */
export function holds(condition: Condition, answers: Answers): boolean {
  if ('all' in condition) {
    return condition.all.every((entry) => holds(entry, answers))
  }
  if ('any' in condition) {
    return condition.any.some((entry) => holds(entry, answers))
  }
  return holdsComparison(condition, answers)
}
