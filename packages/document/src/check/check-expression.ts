import type { Condition } from '../condition'
import type { Expression } from '../expression'
import { pathTo } from '../path-to'
import { checkCondition } from './check-condition'
import type { CheckWalk } from './check-walk'
import { report } from './report'
import { isResultKind, type ResultKind } from './result-kind'

type At = { walk: CheckWalk; path: string }

type Operation = { op: string; args: readonly Expression[]; digits?: number }

const NUMBER: ResultKind = 'number'
const ANY_KIND = 'number, text or date'

type OperandCount = { fewest: number; most: number }

const ANY_NUMBER: OperandCount = { fewest: 1, most: Number.POSITIVE_INFINITY }
const ONE: OperandCount = { fewest: 1, most: 1 }
const TWO: OperandCount = { fewest: 2, most: 2 }

const OPERAND_COUNTS: Readonly<Record<string, OperandCount>> = {
  add: ANY_NUMBER,
  multiply: ANY_NUMBER,
  min: ANY_NUMBER,
  max: ANY_NUMBER,
  subtract: TWO,
  divide: TWO,
  round: ONE,
  otherwise: TWO,
}

// Beyond 15 digits a double holds no more, and the factor of rounding overflows past 308.
const MOST_DIGITS = 15

const mismatch = ({ walk, path }: At, params: { op: string; expected: string }): void => {
  report(walk, { code: 'operandMismatch', path, params })
}

const checkRead = (key: string, { walk, path }: At): ResultKind | undefined => {
  const fieldPath = `${path}.field`
  if (!walk.allFieldKeys.has(key)) {
    report(walk, { code: 'unknownField', path: fieldPath, params: { field: key } })
    return undefined
  }
  const earlier = walk.earlier.get(key)
  if (earlier === undefined) {
    report(walk, { code: 'laterField', path: fieldPath, params: { field: key } })
    return undefined
  }
  if (earlier.valueType === undefined) {
    return undefined
  }
  const kind = earlier.valueType.comparesAs?.type
  if (!isResultKind(kind)) {
    mismatch({ walk, path: fieldPath }, { op: 'field', expected: ANY_KIND })
    return undefined
  }
  return kind
}

// Each operand is checked, then its kind against the one expected, so problems stay in order.
const checkOperands = (
  operands: readonly { expression: Expression; path: string }[],
  { at, op, expected }: { at: At; op: string; expected: ResultKind | 'first' },
): ResultKind | undefined => {
  let first: ResultKind | undefined
  for (const { expression, path } of operands) {
    const kind = checkExpression(expression, { walk: at.walk, path })
    const wanted = expected === 'first' ? first : expected
    if (kind !== undefined && wanted !== undefined && kind !== wanted) {
      mismatch({ walk: at.walk, path }, { op, expected: wanted })
    }
    first ??= kind
  }
  return expected === 'first' ? first : expected
}

const checkOperation = ({ op, args, digits }: Operation, at: At): ResultKind | undefined => {
  const count = Object.hasOwn(OPERAND_COUNTS, op) ? OPERAND_COUNTS[op] : undefined
  if (count === undefined) {
    report(at.walk, { code: 'unknownOperation', path: `${at.path}.op`, params: { op } })
    return undefined
  }
  const { fewest, most } = count
  if (args.length < fewest || args.length > most) {
    const expected = fewest === most ? `${fewest} operands` : `at least ${fewest} operand`
    mismatch({ walk: at.walk, path: `${at.path}.args` }, { op, expected })
  }
  const operands = args.map((expression, index) => ({
    expression,
    path: `${at.path}.args[${index}]`,
  }))
  const result = checkOperands(operands, {
    at,
    op,
    expected: op === 'otherwise' ? 'first' : NUMBER,
  })
  if (digits !== undefined && (!Number.isInteger(digits) || digits < 0 || digits > MOST_DIGITS)) {
    mismatch(
      { walk: at.walk, path: `${at.path}.digits` },
      { op, expected: `a whole number up to ${MOST_DIGITS}` },
    )
  }
  return result
}

// Each case's condition, then its result, so problems stay in document order.
type Cases = { cases: readonly { when: Condition; value: Expression }[]; otherwise: Expression }

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
    const casePath = pathTo.case(at.path, index)
    checkCondition(entry.when, pathTo.caseWhen(at.path, index), at.walk)
    checkResult(entry.value, `${casePath}.value`)
  })
  checkResult(otherwise, `${at.path}.otherwise`)
  return first
}

/**
 * Checks an expression against the answers before it and returns what it comes to: each answer
 * read exists, comes earlier and is a number, a text or a date; each operation is known, takes as
 * many operands as it has, of the kinds it works on; the results of a choice by conditions are of
 * one kind. `undefined` when what it comes to cannot be told, as a problem was reported.
 */
export function checkExpression(expression: Expression, at: At): ResultKind | undefined {
  if ('field' in expression) {
    return checkRead(expression.field, at)
  }
  if ('value' in expression) {
    return typeof expression.value === 'number' ? NUMBER : 'text'
  }
  if ('cases' in expression) {
    return checkCases(expression, at)
  }
  return checkOperation(expression, at)
}
