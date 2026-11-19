import type { Condition, ListOperator, PresenceOperator, ValueOperator } from '../condition'
import {
  failAt,
  hasKey,
  readList,
  readOnlyKeys,
  readShape,
  readText,
  readTextList,
  readTextOrNumber,
} from './reader'

const PRESENCE_OPERATORS: readonly PresenceOperator[] = ['isFilled', 'isEmpty', 'isTrue', 'isFalse']

const VALUE_OPERATORS: readonly ValueOperator[] = [
  'equals',
  'notEquals',
  'lessThan',
  'atMost',
  'greaterThan',
  'atLeast',
  'before',
  'onOrBefore',
  'after',
  'onOrAfter',
  'includes',
  'excludes',
]

const LIST_OPERATORS: readonly ListOperator[] = ['in', 'notIn']

const COMPARISON_KEYS = ['field', 'op', 'value']

const readConditions = (value: unknown, path: string): Condition[] =>
  readList(value, path).map((entry, index) => readCondition(entry, `${path}[${index}]`))

const isOperatorOf = <TOperator extends string>(
  operators: readonly TOperator[],
  op: string,
): op is TOperator => operators.includes(op as TOperator)

const readComparison = (shape: Record<string, unknown>, path: string): Condition => {
  readOnlyKeys(shape, COMPARISON_KEYS, path)
  const field = readText(shape.field, `${path}.field`)
  const op = readText(shape.op, `${path}.op`)

  if (isOperatorOf(PRESENCE_OPERATORS, op)) {
    readOnlyKeys(shape, ['field', 'op'], path)
    return { field, op }
  }
  if (isOperatorOf(VALUE_OPERATORS, op)) {
    return { field, op, value: readTextOrNumber(shape.value, `${path}.value`) }
  }
  if (isOperatorOf(LIST_OPERATORS, op)) {
    return { field, op, value: readTextList(shape.value, `${path}.value`) }
  }

  return failAt(`${path}.op`, `unknown operator ${op}.`)
}

export const readCondition = (value: unknown, path: string): Condition => {
  const shape = readShape(value, path)

  if (hasKey(shape, 'all')) {
    readOnlyKeys(shape, ['all'], path)
    return { all: readConditions(shape.all, `${path}.all`) }
  }
  if (hasKey(shape, 'any')) {
    readOnlyKeys(shape, ['any'], path)
    return { any: readConditions(shape.any, `${path}.any`) }
  }

  return readComparison(shape, path)
}
