import { failAt } from '../fail-at'
import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import type { Shape } from './read-shape'

const readJsonList = (value: unknown[], path: string): JsonValue[] =>
  value.map((entry, index) => readJson(entry, `${path}[${index}]`))

const readJsonShape = (value: Shape, path: string): Record<string, JsonValue> =>
  Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, readJson(entry, `${path}.${key}`)]),
  )

export function readJson(value: unknown, path: string): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (Array.isArray(value)) {
    return readJsonList(value, path)
  }
  if (isPlainObject(value)) {
    return readJsonShape(value, path)
  }

  return failAt(path, 'expected a value.')
}
