import { dayOf } from '../day-of'
import type { Expression } from '../expression'
import type { Answers } from './answers'
import { holds } from './holds'

/** What an expression comes to: a number, a text or a date as an ISO string. */
export type Computed = number | string

type Arithmetic = (numbers: readonly number[]) => number | undefined

type Operation = { op: string; args: readonly Expression[]; digits?: number }

const DIGITS_BASE = 10
const MS_PER_DAY = 86_400_000

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

const chosenOf = (key: string, answers: Answers): { values: string[]; scores: number[] } => {
  const answer = answers.get(key)
  if (answer === undefined) {
    return { values: [], scores: [] }
  }
  const values = (Array.isArray(answer.value) ? answer.value : [answer.value]) as string[]
  const scores = values.map(
    (value) => answer.options.find((option) => option.value === value)?.score ?? 0,
  )
  return { values, scores }
}

const computeOnChoices = ({ op, field }: { op: string; field: string }, answers: Answers) => {
  const { values, scores } = chosenOf(field, answers)
  if (op === 'count') {
    return values.length
  }
  return op === 'score' ? scores.reduce((sum, score) => sum + score, 0) : undefined
}

// An answer joins as its placeholder writes it, such as a decimal with its comma.
const textOf = (expression: Expression, answers: Answers): string | undefined => {
  if ('field' in expression && !('op' in expression)) {
    return answers.get(expression.field)?.text
  }
  const value = compute(expression, answers)
  return value === undefined ? undefined : String(value)
}

const joined = (args: readonly Expression[], answers: Answers): string | undefined => {
  const texts = args.map((arg) => textOf(arg, answers))
  return texts.every((text) => text !== undefined) ? texts.join('') : undefined
}

const daysBetween = (args: readonly Expression[], answers: Answers): number | undefined => {
  const [from, to] = args.map((arg) => compute(arg, answers))
  if (typeof from !== 'string' || typeof to !== 'string') {
    return undefined
  }
  const dayStart = (date: string): number => Date.parse(`${dayOf(date)}T00:00:00Z`)
  return Math.round((dayStart(to) - dayStart(from)) / MS_PER_DAY)
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
  { op, args, digits = 0 }: Operation,
  answers: Answers,
): Computed | undefined => {
  if (op === 'otherwise') {
    const [first, fallback] = args
    const value = first === undefined ? undefined : compute(first, answers)
    return value ?? (fallback === undefined ? undefined : compute(fallback, answers))
  }
  if (op === 'concat') {
    return joined(args, answers)
  }
  if (op === 'daysBetween') {
    return daysBetween(args, answers)
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
 * empty first expression with its second; `count` and `score` of a field without choices are 0.
 */
export function compute(expression: Expression, answers: Answers): Computed | undefined {
  if ('op' in expression) {
    return finite(
      'field' in expression
        ? computeOnChoices(expression, answers)
        : computeOperation(expression, answers),
    )
  }
  if ('field' in expression) {
    return finite(answerOf(expression.field, answers))
  }
  if ('value' in expression) {
    return expression.value
  }
  const chosen = expression.cases.find((entry) => holds(entry.when, answers))
  return compute(chosen?.value ?? expression.otherwise, answers)
}
