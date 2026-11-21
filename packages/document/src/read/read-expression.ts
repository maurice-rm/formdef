import type { Expression } from '../expression'
import { failAt } from '../fail-at'
import { hasKey } from './has-key'
import { readCondition } from './read-condition'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'
import { readVarying } from './read-varying'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const readConstant = (value: unknown, path: string): number | string =>
  isFiniteNumber(value) || typeof value === 'string'
    ? value
    : failAt(path, 'expected a number or text.')

// The operations come from the package, which `checkDocument` checks the expression against.
const readOperation = (shape: Shape, path: string): Expression => {
  if (hasKey(shape, 'field')) {
    readOnlyKeys(shape, ['op', 'field', 'when'], path)
    const onField = {
      op: readText(shape.op, `${path}.op`),
      field: readText(shape.field, `${path}.field`),
    }
    return shape.when === undefined
      ? onField
      : { ...onField, when: readCondition(shape.when, `${path}.when`) }
  }
  readOnlyKeys(shape, ['op', 'args', 'digits'], path)
  const op = readText(shape.op, `${path}.op`)
  const args = readList(shape.args, `${path}.args`).map((arg, index) =>
    readExpression(arg, `${path}.args[${index}]`),
  )
  if (shape.digits === undefined) {
    return { op, args }
  }
  const digits = isFiniteNumber(shape.digits)
    ? shape.digits
    : failAt(`${path}.digits`, 'expected a number.')
  return { op, args, digits }
}

/** Reads an expression of a computed value: an answer read, a constant, an operation or a choice. */
export function readExpression(value: unknown, path: string): Expression {
  const shape = readShape(value, path)

  if (hasKey(shape, 'op')) {
    return readOperation(shape, path)
  }
  if (hasKey(shape, 'field')) {
    readOnlyKeys(shape, ['field'], path)
    return { field: readText(shape.field, `${path}.field`) }
  }
  if (hasKey(shape, 'value')) {
    readOnlyKeys(shape, ['value'], path)
    return { value: readConstant(shape.value, `${path}.value`) }
  }
  if (hasKey(shape, 'cases')) {
    return readVarying(shape, path, readExpression)
  }
  return failAt(path, 'expected an expression: field, value, op or cases.')
}
