import type { Condition } from '../condition'
import type { Expression } from '../expression'
import type { SettingType } from '../kinds/setting'
import { pathTo } from '../path-to'
import { checkCondition } from './check-condition'
import type { CheckWalk } from './check-walk'
import { earlierFieldNamed } from './earlier-field-named'
import { report } from './report'
import { isResultKind, type ResultKind } from './result-kind'

type At = { walk: CheckWalk; path: string }

type Operation = { op: string; args: readonly Expression[]; digits?: number }

type OperandCount = { fewest: number; most: number }

/** What an operation takes: how many operands, of which kind, and what it comes to. */
type OperationShape = {
  count: OperandCount
  /** The kind every operand has; `first` the kind of the first; `any` every kind. */
  operands: ResultKind | 'first' | 'any'
  /** What it comes to; `first` the kind of its first operand. */
  result: ResultKind | 'first'
}

const NUMBER: ResultKind = 'number'
const ANY_KIND = 'number, text or date'

const ANY_NUMBER: OperandCount = { fewest: 1, most: Number.POSITIVE_INFINITY }
const ONE: OperandCount = { fewest: 1, most: 1 }
const TWO: OperandCount = { fewest: 2, most: 2 }

const ON_NUMBERS: OperationShape = { count: ANY_NUMBER, operands: NUMBER, result: NUMBER }
const ON_TWO_NUMBERS: OperationShape = { count: TWO, operands: NUMBER, result: NUMBER }

const OPERATIONS: Readonly<Record<string, OperationShape>> = {
  add: ON_NUMBERS,
  multiply: ON_NUMBERS,
  min: ON_NUMBERS,
  max: ON_NUMBERS,
  subtract: ON_TWO_NUMBERS,
  divide: ON_TWO_NUMBERS,
  round: { count: ONE, operands: NUMBER, result: NUMBER },
  otherwise: { count: TWO, operands: 'first', result: 'first' },
  concat: { count: ANY_NUMBER, operands: 'any', result: 'text' },
  daysBetween: { count: TWO, operands: 'date', result: NUMBER },
}

const ACROSS_ENTRIES: ReadonlySet<string> = new Set(['sum', 'min', 'max'])
const COUNT_WHERE = 'countWhere'

// The setting types a field compares as, for each operation on its choices.
const CHOICE_OPERATIONS: Readonly<Record<string, readonly SettingType[]>> = {
  count: ['optionList'],
  score: ['option', 'optionList'],
}

// Beyond 15 digits a double holds no more, and the factor of rounding overflows past 308.
const MOST_DIGITS = 15

const mismatch = ({ walk, path }: At, params: { op: string; expected: string }): void => {
  report(walk, { code: 'operandMismatch', path, params })
}

const checkRead = (key: string, at: At): ResultKind | undefined => {
  const fieldAt = { walk: at.walk, path: `${at.path}.field` }
  const valueType = earlierFieldNamed(key, fieldAt)?.valueType
  if (valueType === undefined) {
    return undefined
  }
  const kind = valueType.comparesAs?.type
  if (!isResultKind(kind)) {
    mismatch(fieldAt, { op: 'field', expected: ANY_KIND })
    return undefined
  }
  return kind
}

type OnField = { op: string; field: string; when?: Condition }

const checkOnChoices = ({ op, field }: OnField, at: At): ResultKind | undefined => {
  const accepted = Object.hasOwn(CHOICE_OPERATIONS, op) ? CHOICE_OPERATIONS[op] : undefined
  if (accepted === undefined) {
    report(at.walk, { code: 'unknownOperation', path: `${at.path}.op`, params: { op } })
    return undefined
  }
  const fieldAt = { walk: at.walk, path: `${at.path}.field` }
  const valueType = earlierFieldNamed(field, fieldAt)?.valueType
  const type = valueType?.comparesAs?.type
  if (valueType !== undefined && (type === undefined || !accepted.includes(type))) {
    mismatch(fieldAt, { op, expected: 'a field that chooses' })
  }
  return NUMBER
}

const reportNotNamed = (
  field: string,
  { at, op, expected }: { at: At; op: string; expected: string },
): void => {
  if (!at.walk.allFieldKeys.has(field)) {
    report(at.walk, { code: 'unknownField', path: at.path, params: { field } })
    return
  }
  mismatch(at, { op, expected })
}

// A field inside a repeat is read across its entries only once the repeat is left.
const checkAcrossEntries = ({ op, field }: OnField, at: At): ResultKind => {
  const fieldAt = { walk: at.walk, path: `${at.path}.field` }
  const repeat = at.walk.repeatOfField.get(field)
  const scope = repeat === undefined ? undefined : at.walk.repeatScopes.get(repeat)
  const valueType = scope?.get(field)?.valueType
  if (scope === undefined) {
    reportNotNamed(field, { at: fieldAt, op, expected: 'a number field of an earlier repeat' })
  } else if (valueType !== undefined && valueType.comparesAs?.type !== NUMBER) {
    mismatch(fieldAt, { op, expected: 'a number field of an earlier repeat' })
  }
  return NUMBER
}

// The condition reads each entry: the fields of the repeat and those before it.
const checkCountWhere = ({ op, field, when }: OnField, at: At): ResultKind => {
  const scope = at.walk.repeatScopes.get(field)
  if (scope === undefined) {
    const fieldAt = { walk: at.walk, path: `${at.path}.field` }
    reportNotNamed(field, { at: fieldAt, op, expected: 'an earlier repeat' })
  }
  if (when === undefined) {
    mismatch(at, { op, expected: 'a condition' })
  } else if (scope !== undefined) {
    checkCondition(when, `${at.path}.when`, { ...at.walk, earlier: new Map(scope) })
  }
  return NUMBER
}

const checkOnField = (operation: OnField, at: At): ResultKind | undefined => {
  const { op, field, when } = operation
  if (when !== undefined && op !== COUNT_WHERE) {
    mismatch({ walk: at.walk, path: `${at.path}.when` }, { op, expected: 'no condition' })
  }
  if (ACROSS_ENTRIES.has(op)) {
    return checkAcrossEntries(operation, at)
  }
  if (op === COUNT_WHERE) {
    return checkCountWhere(operation, at)
  }
  return op === 'count' && at.walk.repeatScopes.has(field) ? NUMBER : checkOnChoices(operation, at)
}

// Each operand is checked, then its kind against the one expected, so problems stay in order.
const checkOperands = (
  operands: readonly { expression: Expression; path: string }[],
  { at, op, expected }: { at: At; op: string; expected: OperationShape['operands'] },
): ResultKind | undefined => {
  let first: ResultKind | undefined
  for (const { expression, path } of operands) {
    const kind = checkExpression(expression, { walk: at.walk, path })
    const wanted = expected === 'first' ? first : expected
    if (kind !== undefined && wanted !== undefined && wanted !== 'any' && kind !== wanted) {
      mismatch({ walk: at.walk, path }, { op, expected: wanted })
    }
    first ??= kind
  }
  return first
}

const checkCount = (
  args: readonly Expression[],
  { op, count, at }: { op: string; count: OperandCount; at: At },
): void => {
  if (args.length >= count.fewest && args.length <= count.most) {
    return
  }
  const expected =
    count.fewest === count.most ? `${count.fewest} operands` : `at least ${count.fewest} operand`
  mismatch({ walk: at.walk, path: `${at.path}.args` }, { op, expected })
}

const checkOperation = ({ op, args, digits }: Operation, at: At): ResultKind | undefined => {
  const shape = Object.hasOwn(OPERATIONS, op) ? OPERATIONS[op] : undefined
  if (shape === undefined) {
    report(at.walk, { code: 'unknownOperation', path: `${at.path}.op`, params: { op } })
    return undefined
  }
  checkCount(args, { op, count: shape.count, at })
  const operands = args.map((expression, index) => ({
    expression,
    path: `${at.path}.args[${index}]`,
  }))
  const first = checkOperands(operands, { at, op, expected: shape.operands })
  if (digits !== undefined && (!Number.isInteger(digits) || digits < 0 || digits > MOST_DIGITS)) {
    mismatch(
      { walk: at.walk, path: `${at.path}.digits` },
      { op, expected: `a whole number up to ${MOST_DIGITS}` },
    )
  }
  return shape.result === 'first' ? first : shape.result
}

type Cases = { cases: readonly { when: Condition; value: Expression }[]; otherwise: Expression }

// Each case's condition, then its result, so problems stay in document order.
const checkCases = ({ cases, otherwise }: Cases, at: At): ResultKind | undefined => {
  let first: ResultKind | undefined
  const checkResult = (expression: Expression, path: string): void => {
    const kind = checkExpression(expression, { walk: at.walk, path })
    if (kind !== undefined && first !== undefined && kind !== first) {
      mismatch({ walk: at.walk, path }, { op: 'cases', expected: first })
    }
    first ??= kind
  }
  cases.forEach((entry, index) => {
    checkCondition(entry.when, pathTo.caseWhen(at.path, index), at.walk)
    checkResult(entry.value, `${pathTo.case(at.path, index)}.value`)
  })
  checkResult(otherwise, `${at.path}.otherwise`)
  return first
}

/**
 * Checks an expression against the answers before it and returns what it comes to: each answer
 * read exists, comes earlier and is a number, a text or a date; each operation is known, takes as
 * many operands as it has, of the kinds it works on; `count` and `score` read a field that
 * chooses; `sum`, `min` and `max` read a number field of an earlier repeat, `count` and
 * `countWhere` an earlier repeat, the latter with a condition on its entries; the results of a
 * choice by conditions are of one kind. `undefined` when what it comes
 * to cannot be told, as a problem was reported.
 */
export function checkExpression(expression: Expression, at: At): ResultKind | undefined {
  if ('op' in expression) {
    return 'field' in expression ? checkOnField(expression, at) : checkOperation(expression, at)
  }
  if ('field' in expression) {
    return checkRead(expression.field, at)
  }
  if ('value' in expression) {
    return typeof expression.value === 'number' ? NUMBER : 'text'
  }
  return checkCases(expression, at)
}
