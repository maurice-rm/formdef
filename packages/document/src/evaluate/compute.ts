import type { Expression } from '../expression'
import type { Answers } from './answers'
import { holds } from './holds'

/** What an expression comes to: a number, a text or a date as an ISO string. */
export type Computed = number | string

type Arithmetic = (numbers: readonly number[]) => number | undefined

const DIGITS_BASE = 10

const ARITHMETIC: Readonly<Record<string, Arithmetic>> = {
  add: (numbers) => numbers.reduce((sum, number) => sum + number, 0),
  subtract: ([first = 0, second = 0]) => first - second,
  multiply: (numbers) => numbers.reduce((product, number) => product * number, 1),
  divide: ([first = 0, second = 0]) => (second === 0 ? undefined : first / second),
  min: (numbers) => numbers.reduce((smallest, number) => Math.min(smallest, number)),
  max: (numbers) => numbers.reduce((largest, number) => Math.max(largest, number)),
}

const answerOf = (key: string, answers: Answers): Computed | undefined => {
  const answer = answers.get(key)
  const comparesAs = answers.valueTypeOf(key)?.comparesAs
  if (answer === undefined || comparesAs === undefined) {
    return undefined
  }
  const value = comparesAs.of(answer.value)
  return typeof value === 'number' || typeof value === 'string' ? value : undefined
}

const numbersOf = (args: readonly Expression[], answers: Answers): number[] | undefined => {
  const values = args.map((arg) => compute(arg, answers))
  return values.every((value) => typeof value === 'number') ? values : undefined
}

const roundTo = (value: number, digits: number): number => {
  const factor = DIGITS_BASE ** digits
  return Math.round(value * factor) / factor
}

const computeOperation = (
  { op, args, digits = 0 }: { op: string; args: readonly Expression[]; digits?: number },
  answers: Answers,
): Computed | undefined => {
  if (op === 'otherwise') {
    const [first, fallback] = args
    const value = first === undefined ? undefined : compute(first, answers)
    return value ?? (fallback === undefined ? undefined : compute(fallback, answers))
  }
  const numbers = numbersOf(args, answers)
  if (numbers === undefined) {
    return undefined
  }
  if (op === 'round') {
    return numbers[0] === undefined ? undefined : roundTo(numbers[0], digits)
  }
  return Object.hasOwn(ARITHMETIC, op) ? ARITHMETIC[op]?.(numbers) : undefined
}

const finite = (value: Computed | undefined): Computed | undefined =>
  typeof value === 'number' && !Number.isFinite(value) ? undefined : value

/**
 * What an expression comes to for these answers; `undefined` when it is empty: an operand without
 * an answer, a division by zero, or a result that is no finite number. `otherwise` replaces an
 * empty first expression with its second.
 */
export function compute(expression: Expression, answers: Answers): Computed | undefined {
  if ('field' in expression) {
    return finite(answerOf(expression.field, answers))
  }
  if ('value' in expression) {
    return expression.value
  }
  if ('cases' in expression) {
    const chosen = expression.cases.find((entry) => holds(entry.when, answers))
    return compute(chosen?.value ?? expression.otherwise, answers)
  }
  return finite(computeOperation(expression, answers))
}
