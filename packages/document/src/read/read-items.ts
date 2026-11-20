import type { Condition } from '../condition'
import type {
  BlockItem,
  DocumentItem,
  FieldItem,
  RowItem,
  SectionItem,
  Varying,
} from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import { looksVarying } from '../looks-varying'
import { pathTo } from '../path-to'
import type { VaryingText } from '../varying-text'
import { readCondition } from './read-condition'
import { readJson } from './read-json'
import { readList } from './read-list'
import { readOneOf } from './read-one-of'
import { readOnlyKeys } from './read-only-keys'
import { readOptionalText } from './read-optional-text'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'
import { readTranslatableText } from './read-translatable-text'
import { readVarying } from './read-varying'
import { readVaryingText } from './read-varying-text'
import { readVisibleWhen } from './read-visible-when'
import { withOptional } from './with-optional'

const ITEM_TYPES = ['field', 'block', 'section', 'row'] as const
const ROW_ITEM_TYPES = ['field', 'block'] as const

const FIELD_KEYS = [
  'type',
  'key',
  'kind',
  'label',
  'description',
  'required',
  'visibleWhen',
  'settings',
  'messages',
]
const BLOCK_KEYS = ['type', 'key', 'kind', 'visibleWhen', 'settings']
const ROW_KEYS = ['type', 'visibleWhen', 'items']
const SECTION_KEYS = ['type', 'label', 'description', 'visibleWhen', 'items']
const OPTION_TEXTS = ['label', 'description']

const readRequired = (value: unknown, path: string): boolean | Condition =>
  typeof value === 'boolean' ? value : readCondition(value, path)

const readOption = (value: unknown, path: string): JsonValue => {
  const entry = readJson(value, path)
  if (!isPlainObject(value) || !OPTION_TEXTS.some((name) => looksVarying(value[name]))) {
    return entry
  }
  const texts = OPTION_TEXTS.filter((name) => looksVarying(value[name])).map((name) => [
    name,
    readVaryingText(value[name], `${path}.${name}`),
  ])
  return { ...(entry as Record<string, JsonValue>), ...Object.fromEntries(texts) }
}

const readSettingValue = (value: unknown, path: string): JsonValue =>
  Array.isArray(value)
    ? value.map((entry, index) => readOption(entry, `${path}[${index}]`))
    : readJson(value, path)

const readSetting = (value: unknown, path: string): JsonValue | Varying =>
  looksVarying(value) ? readVarying(value, path, readSettingValue) : readSettingValue(value, path)

const readSettings = (value: unknown, path: string): Record<string, JsonValue | Varying> =>
  Object.fromEntries(
    Object.entries(readShape(value, path)).map(([name, setting]) => [
      name,
      readSetting(setting, `${path}.${name}`),
    ]),
  )

const readMessages = (value: unknown, path: string): Record<string, VaryingText> =>
  Object.fromEntries(
    Object.entries(readShape(value, path)).map(([code, text]) => [
      code,
      readVaryingText(text, `${path}.${code}`),
    ]),
  )

const readField = (shape: Shape, path: string): FieldItem => {
  readOnlyKeys(shape, FIELD_KEYS, path)

  return {
    type: 'field',
    key: readText(shape.key, `${path}.key`),
    kind: readText(shape.kind, `${path}.kind`),
    label: readVaryingText(shape.label, `${path}.label`),
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
    ...withOptional(
      'messages',
      shape.messages === undefined ? undefined : readMessages(shape.messages, `${path}.messages`),
    ),
  }
}

const readBlock = (shape: Shape, path: string): BlockItem => {
  readOnlyKeys(shape, BLOCK_KEYS, path)

  return {
    type: 'block',
    key: readText(shape.key, `${path}.key`),
    kind: readText(shape.kind, `${path}.kind`),
    ...readVisibleWhen(shape, path),
    ...withOptional(
      'settings',
      shape.settings === undefined ? undefined : readSettings(shape.settings, `${path}.settings`),
    ),
  }
}

const readRowItem = (value: unknown, path: string): FieldItem | BlockItem => {
  const shape = readShape(value, path)
  const type = readOneOf(shape.type, ROW_ITEM_TYPES, `${path}.type`)

  return type === 'field' ? readField(shape, path) : readBlock(shape, path)
}

const readRow = (shape: Shape, path: string): RowItem => {
  readOnlyKeys(shape, ROW_KEYS, path)
  const items = readList(shape.items, `${path}.items`).map((entry, index) =>
    readRowItem(entry, `${path}.items[${index}]`),
  )

  return { type: 'row', ...readVisibleWhen(shape, path), items }
}

const readSection = (shape: Shape, path: string): SectionItem => {
  readOnlyKeys(shape, SECTION_KEYS, path)

  return {
    type: 'section',
    label: readTranslatableText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
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
  if (type === 'block') {
    return readBlock(shape, path)
  }
  if (type === 'row') {
    return readRow(shape, path)
  }
  return readSection(shape, path)
}

export function readItems(value: unknown, path: string): DocumentItem[] {
  return readList(value, path).map((entry, index) => readItem(entry, `${path}[${index}]`))
}
