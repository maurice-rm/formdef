import { failAt } from '../fail-at'
import type { JsonValue } from '../form-document'
import { isPlainObject } from '../is-plain-object'

type Shape = Record<string, unknown>

export const readShape = (value: unknown, path: string): Shape =>
  isPlainObject(value) ? value : failAt(path, 'expected an object.')

export const readOnlyKeys = (shape: Shape, keys: readonly string[], path: string): void => {
  const unknown = Object.keys(shape).find((key) => !keys.includes(key))
  if (unknown !== undefined) failAt(`${path}.${unknown}`, 'unknown key.')
}

export const readText = (value: unknown, path: string): string =>
  typeof value === 'string' && value !== '' ? value : failAt(path, 'expected text.')

export const readOptionalText = (value: unknown, path: string): string | undefined =>
  value === undefined ? undefined : readText(value, path)

export const readList = (value: unknown, path: string): unknown[] =>
  Array.isArray(value) ? value : failAt(path, 'expected a list.')

export const readTextOrNumber = (value: unknown, path: string): string | number =>
  typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
    ? value
    : failAt(path, 'expected text or a number.')

export const readTextList = (value: unknown, path: string): string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? [...value]
    : failAt(path, 'expected a list of text.')

export const readOneOf = <TValue extends string>(
  value: unknown,
  choices: readonly TValue[],
  path: string,
): TValue =>
  choices.includes(value as TValue)
    ? (value as TValue)
    : failAt(path, `expected one of ${choices.join(', ')}.`)

const readJsonList = (value: unknown[], path: string): JsonValue[] =>
  value.map((entry, index) => readJson(entry, `${path}[${index}]`))

const readJsonShape = (value: Shape, path: string): Record<string, JsonValue> =>
  Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, readJson(entry, `${path}.${key}`)]),
  )

export const readJson = (value: unknown, path: string): JsonValue => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return readJsonList(value, path)
  if (isPlainObject(value)) return readJsonShape(value, path)

  return failAt(path, 'expected a value.')
}

export const hasKey = (shape: Shape, key: string): boolean => Object.hasOwn(shape, key)
