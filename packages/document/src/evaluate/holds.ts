import type { Comparison, Condition } from '../condition'
import { dayOf } from '../day-of'
import { valueTypes } from '../kinds/value-types'
import { numberOf } from '../number-of'
import type { Answer, Answers } from './answers'

type Comparable = number | string
type Order = (answer: Comparable, compared: Comparable) => boolean

const isLess: Order = (answer, compared) => answer < compared
const isAtMost: Order = (answer, compared) => answer <= compared
const isGreater: Order = (answer, compared) => answer > compared
const isAtLeast: Order = (answer, compared) => answer >= compared

const comparableOf = (value: unknown, { valueType }: Answer): Comparable => {
  const plain = value as Comparable
  if (valueType === valueTypes.decimal) {
    return numberOf(plain)
  }
  if (valueType === valueTypes.date) {
    return dayOf(String(plain))
  }
  return plain
}

const isEqual = (answer: Answer | undefined, compared: Comparable): boolean =>
  answer !== undefined && comparableOf(answer.value, answer) === comparableOf(compared, answer)

const isOrdered = (answer: Answer | undefined, compared: Comparable, order: Order): boolean =>
  answer !== undefined && order(comparableOf(answer.value, answer), comparableOf(compared, answer))

const isIn = (answer: Answer | undefined, list: readonly string[]): boolean =>
  answer !== undefined && list.includes(answer.value as string)

const doesInclude = (answer: Answer | undefined, compared: Comparable): boolean =>
  answer !== undefined && (answer.value as readonly Comparable[]).includes(compared)

const holdsComparison = (comparison: Comparison, answer: Answer | undefined): boolean => {
  switch (comparison.op) {
    case 'isFilled':
      return answer !== undefined
    case 'isEmpty':
      return answer === undefined
    case 'isTrue':
      return answer?.value === true
    case 'isFalse':
      return answer?.value !== true
    case 'equals':
      return isEqual(answer, comparison.value)
    case 'notEquals':
      return !isEqual(answer, comparison.value)
    case 'in':
      return isIn(answer, comparison.value)
    case 'notIn':
      return !isIn(answer, comparison.value)
    case 'includes':
      return doesInclude(answer, comparison.value)
    case 'excludes':
      return !doesInclude(answer, comparison.value)
    case 'lessThan':
    case 'before':
      return isOrdered(answer, comparison.value, isLess)
    case 'atMost':
    case 'onOrBefore':
      return isOrdered(answer, comparison.value, isAtMost)
    case 'greaterThan':
    case 'after':
      return isOrdered(answer, comparison.value, isGreater)
    case 'atLeast':
    case 'onOrAfter':
      return isOrdered(answer, comparison.value, isAtLeast)
  }
}

/**
 * Whether a condition holds for these answers. A field without an answer is empty: it equals
 * nothing and comes in no order, so only the negated operators hold for it.
 */
export function holds(condition: Condition, answers: Answers): boolean {
  if ('all' in condition) {
    return condition.all.every((entry) => holds(entry, answers))
  }
  if ('any' in condition) {
    return condition.any.some((entry) => holds(entry, answers))
  }
  return holdsComparison(condition, answers.get(condition.field))
}
