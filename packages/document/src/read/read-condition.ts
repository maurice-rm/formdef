import type { Condition } from '../condition'
import { failAt } from '../fail-at'
import { LIST_OPERATORS, PRESENCE_OPERATORS, VALUE_OPERATORS } from '../operators'
import { hasKey } from './has-key'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'
import { readTextList } from './read-text-list'
import { readTextOrNumber } from './read-text-or-number'

const COMPARISON_KEYS = ['field', 'op', 'value']

const readConditions = (value: unknown, path: string): Condition[] =>
  readList(value, path).map((entry, index) => readCondition(entry, `${path}[${index}]`))

const isOperatorOf = <TOperator extends string>(
  operators: readonly TOperator[],
  op: string,
): op is TOperator => operators.includes(op as TOperator)

const readComparison = (shape: Shape, path: string): Condition => {
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

  return failAt(`${path}.op`, `unknown operator "${op}".`)
}

export function readCondition(value: unknown, path: string): Condition {
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
