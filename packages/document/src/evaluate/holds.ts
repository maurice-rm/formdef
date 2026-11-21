import type { Comparison, Condition } from '../condition'
import { operatorOf } from '../kinds/operator-of'
import type { Answers } from './answers'

type Compared = { value: unknown } | undefined

const comparedOf = ({ value, valueFrom }: Comparison, answers: Answers): Compared => {
  if (valueFrom === undefined) {
    return { value }
  }
  const other = answers.get(valueFrom)
  const comparesAs = answers.valueTypeOf(valueFrom)?.comparesAs
  return other === undefined || comparesAs === undefined
    ? undefined
    : { value: comparesAs.of(other.value) }
}

const holdsComparison = (comparison: Comparison, answers: Answers): boolean => {
  const valueType = answers.valueTypeOf(comparison.field)
  const operator = valueType === undefined ? undefined : operatorOf(valueType, comparison.op)
  const compared = comparedOf(comparison, answers)
  return (
    compared !== undefined &&
    operator?.holds(answers.get(comparison.field)?.value, compared.value) === true
  )
}

/**
 * Whether a condition holds for these answers, by the operators of the compared fields' value
 * types. A field without an answer is empty; a comparison by an operator its field's value type
 * does not have holds for nothing, as {@link checkDocument} reports it beforehand. A comparison with
 * the answer of another field holds for nothing while that field has none.
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
