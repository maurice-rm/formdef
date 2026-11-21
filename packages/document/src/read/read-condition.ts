import type { Comparison, Condition } from '../condition'
import { failAt } from '../fail-at'
import { hasKey } from './has-key'
import { readEach } from './read-each'
import { readJson } from './read-json'
import { readOnlyKeys } from './read-only-keys'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'

const COMPARISON_KEYS = ['field', 'op', 'value', 'valueFrom']

const readConditions = (value: unknown, path: string): Condition[] =>
  readEach(value, path, readCondition)

// The operators come from the catalog, which `checkDocument` checks the comparison against.
const readComparison = (shape: Shape, path: string): Comparison => {
  readOnlyKeys(shape, COMPARISON_KEYS, path)
  const field = readText(shape.field, `${path}.field`)
  const op = readText(shape.op, `${path}.op`)

  if (hasKey(shape, 'value') && hasKey(shape, 'valueFrom')) {
    failAt(path, 'expected either value or valueFrom, not both.')
  }
  if (hasKey(shape, 'valueFrom')) {
    return { field, op, valueFrom: readText(shape.valueFrom, `${path}.valueFrom`) }
  }
  return hasKey(shape, 'value')
    ? { field, op, value: readJson(shape.value, `${path}.value`) }
    : { field, op }
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
