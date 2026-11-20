import type { Condition } from '../condition'
import { failAt } from '../fail-at'
import type { DocumentItem, FieldItem, RowItem, SectionItem, Varying } from '../form-document'
import type { JsonValue } from '../json-value'
import { looksVarying } from '../looks-varying'
import { pathTo } from '../path-to'
import { hasKey } from './has-key'
import { readCondition } from './read-condition'
import { readJson } from './read-json'
import { readList } from './read-list'
import { readOneOf } from './read-one-of'
import { readOnlyKeys } from './read-only-keys'
import { readOptionalText } from './read-optional-text'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'
import { readVisibleWhen } from './read-visible-when'
import { withOptional } from './with-optional'

const ITEM_TYPES = ['field', 'section', 'row'] as const

const FIELD_KEYS = [
  'type',
  'key',
  'kind',
  'label',
  'description',
  'required',
  'visibleWhen',
  'settings',
]
const ROW_KEYS = ['type', 'visibleWhen', 'items']
const SECTION_KEYS = ['type', 'label', 'visibleWhen', 'items']
const VARYING_KEYS = ['cases', 'otherwise']
const CASE_KEYS = ['when', 'value']

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

const readVarying = (shape: Shape, path: string): Varying => {
  readOnlyKeys(shape, VARYING_KEYS, path)
  const cases = readList(shape.cases, `${path}.cases`).map((entry, index) =>
    readCase(entry, pathTo.case(path, index)),
  )
  if (!hasKey(shape, 'otherwise')) {
    failAt(`${path}.otherwise`, 'expected a value.')
  }

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

const readField = (shape: Shape, path: string): FieldItem => {
  readOnlyKeys(shape, FIELD_KEYS, path)

  return {
    type: 'field',
    key: readText(shape.key, `${path}.key`),
    kind: readText(shape.kind, `${path}.kind`),
    label: readText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
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
  if (shape.type !== 'field') {
    failAt(`${path}.type`, 'a row holds fields only.')
  }

  return readField(shape, path)
}

const readRow = (shape: Shape, path: string): RowItem => {
  readOnlyKeys(shape, ROW_KEYS, path)
  const items = readList(shape.items, `${path}.items`).map((entry, index) =>
    readRowField(entry, `${path}.items[${index}]`),
  )

  return { type: 'row', ...readVisibleWhen(shape, path), items }
}

const readSection = (shape: Shape, path: string): SectionItem => {
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

  if (type === 'field') {
    return readField(shape, path)
  }
  if (type === 'row') {
    return readRow(shape, path)
  }
  return readSection(shape, path)
}

export function readItems(value: unknown, path: string): DocumentItem[] {
  return readList(value, path).map((entry, index) => readItem(entry, `${path}[${index}]`))
}
