import type { Condition } from '../condition'
import { pathTo } from '../document-path'
import { failAt } from '../fail-at'
import type {
  DocumentItem,
  DocumentStep,
  FieldItem,
  JsonValue,
  RowItem,
  SectionItem,
  Varying,
} from '../form-document'
import { looksVarying } from '../is-varying'
import { readCondition } from './read-condition'
import {
  hasKey,
  readJson,
  readList,
  readOneOf,
  readOnlyKeys,
  readOptionalText,
  readShape,
  readText,
} from './reader'

const ITEM_TYPES = ['field', 'section', 'row'] as const

const FIELD_KEYS = ['type', 'key', 'kind', 'label', 'hint', 'required', 'visibleWhen', 'settings']
const ROW_KEYS = ['type', 'visibleWhen', 'items']
const SECTION_KEYS = ['type', 'label', 'visibleWhen', 'items']
const STEP_KEYS = ['key', 'label', 'description', 'visibleWhen', 'items']
const VARYING_KEYS = ['cases', 'otherwise']
const CASE_KEYS = ['when', 'value']

const withOptional = <TKey extends string, TValue>(
  key: TKey,
  value: TValue | undefined,
): Partial<Record<TKey, TValue>> =>
  value === undefined ? {} : ({ [key]: value } as Record<TKey, TValue>)

const readVisibleWhen = (
  shape: Record<string, unknown>,
  path: string,
): Partial<Record<'visibleWhen', Condition>> =>
  withOptional(
    'visibleWhen',
    shape.visibleWhen === undefined
      ? undefined
      : readCondition(shape.visibleWhen, pathTo.visibleWhen(path)),
  )

const readRequired = (value: unknown, path: string): boolean | Condition =>
  typeof value === 'boolean' ? value : readCondition(value, path)

const readCase = (value: unknown, path: string): Varying['cases'][number] => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, CASE_KEYS, path)

  return {
    when: readCondition(shape.when, `${path}.when`),
    value: readJson(shape.value, `${path}.value`),
  }
}

const readVarying = (shape: Record<string, unknown>, path: string): Varying => {
  readOnlyKeys(shape, VARYING_KEYS, path)
  const cases = readList(shape.cases, `${path}.cases`).map((entry, index) =>
    readCase(entry, pathTo.case(path, index)),
  )
  if (!hasKey(shape, 'otherwise')) failAt(`${path}.otherwise`, 'expected a value.')

  return { cases, otherwise: readJson(shape.otherwise, `${path}.otherwise`) }
}

const readSetting = (value: unknown, path: string): JsonValue | Varying =>
  looksVarying(value) ? readVarying(value, path) : readJson(value, path)

const readSettings = (value: unknown, path: string): Record<string, JsonValue | Varying> =>
  Object.fromEntries(
    Object.entries(readShape(value, path)).map(([name, setting]) => [
      name,
      readSetting(setting, `${path}.${name}`),
    ]),
  )

const readField = (shape: Record<string, unknown>, path: string): FieldItem => {
  readOnlyKeys(shape, FIELD_KEYS, path)

  return {
    type: 'field',
    key: readText(shape.key, `${path}.key`),
    kind: readText(shape.kind, `${path}.kind`),
    label: readText(shape.label, `${path}.label`),
    ...withOptional('hint', readOptionalText(shape.hint, `${path}.hint`)),
    ...withOptional(
      'required',
      shape.required === undefined
        ? undefined
        : readRequired(shape.required, pathTo.required(path)),
    ),
    ...readVisibleWhen(shape, path),
    ...withOptional(
      'settings',
      shape.settings === undefined ? undefined : readSettings(shape.settings, `${path}.settings`),
    ),
  }
}

const readRowField = (value: unknown, path: string): FieldItem => {
  const shape = readShape(value, path)
  if (shape.type !== 'field') failAt(`${path}.type`, 'a row holds fields only.')

  return readField(shape, path)
}

const readRow = (shape: Record<string, unknown>, path: string): RowItem => {
  readOnlyKeys(shape, ROW_KEYS, path)
  const items = readList(shape.items, `${path}.items`).map((entry, index) =>
    readRowField(entry, `${path}.items[${index}]`),
  )

  return { type: 'row', ...readVisibleWhen(shape, path), items }
}

const readSection = (shape: Record<string, unknown>, path: string): SectionItem => {
  readOnlyKeys(shape, SECTION_KEYS, path)

  return {
    type: 'section',
    label: readText(shape.label, `${path}.label`),
    ...readVisibleWhen(shape, path),
    items: readItems(shape.items, `${path}.items`),
  }
}

const readItem = (value: unknown, path: string): DocumentItem => {
  const shape = readShape(value, path)
  const type = readOneOf(shape.type, ITEM_TYPES, `${path}.type`)

  if (type === 'field') return readField(shape, path)
  if (type === 'row') return readRow(shape, path)
  return readSection(shape, path)
}

export const readItems = (value: unknown, path: string): DocumentItem[] =>
  readList(value, path).map((entry, index) => readItem(entry, `${path}[${index}]`))

const readStep = (value: unknown, path: string): DocumentStep => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, STEP_KEYS, path)

  return {
    key: readText(shape.key, `${path}.key`),
    label: readText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
    ...readVisibleWhen(shape, path),
    items: readItems(shape.items, `${path}.items`),
  }
}

export const readSteps = (value: unknown, path: string): DocumentStep[] =>
  readList(value, path).map((entry, index) => readStep(entry, `${path}[${index}]`))
