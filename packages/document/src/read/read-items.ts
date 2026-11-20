import type { Condition } from '../condition'
import type {
  BlockItem,
  Check,
  ComputedItem,
  DocumentItem,
  FieldItem,
  RowItem,
  SectionItem,
} from '../form-document'
import { pathTo } from '../path-to'
import type { VaryingText } from '../varying-text'
import { readCondition } from './read-condition'
import { readDisplay } from './read-display'
import { readExpression } from './read-expression'
import { readList } from './read-list'
import { readOneOf } from './read-one-of'
import { readOnlyKeys } from './read-only-keys'
import { readOptionalText } from './read-optional-text'
import { readSettings } from './read-settings'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'
import { readTranslatableText } from './read-translatable-text'
import { readVaryingText } from './read-varying-text'
import { readVisibleWhen } from './read-visible-when'
import { withOptional } from './with-optional'

const ITEM_TYPES = ['field', 'block', 'computed', 'section', 'row'] as const
const ROW_ITEM_TYPES = ['field', 'block', 'computed'] as const

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
  'checks',
]
const CHECK_KEYS = ['when', 'message']
const BLOCK_KEYS = ['type', 'key', 'kind', 'visibleWhen', 'settings']
const COMPUTED_KEYS = ['type', 'key', 'label', 'valueType', 'expression', 'visibleWhen']
const ROW_KEYS = ['type', 'visibleWhen', 'display', 'items']
const SECTION_KEYS = ['type', 'label', 'description', 'visibleWhen', 'display', 'items']

const readRequired = (value: unknown, path: string): boolean | Condition =>
  typeof value === 'boolean' ? value : readCondition(value, path)

const readMessages = (value: unknown, path: string): Record<string, VaryingText> =>
  Object.fromEntries(
    Object.entries(readShape(value, path)).map(([code, text]) => [
      code,
      readVaryingText(text, `${path}.${code}`),
    ]),
  )

const readCheck = (value: unknown, path: string): Check => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, CHECK_KEYS, path)

  return {
    when: readCondition(shape.when, `${path}.when`),
    ...withOptional('message', readOptionalText(shape.message, `${path}.message`)),
  }
}

const readChecks = (value: unknown, path: string): Check[] =>
  readList(value, path).map((entry, index) => readCheck(entry, `${path}[${index}]`))

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
    ...withOptional(
      'checks',
      shape.checks === undefined ? undefined : readChecks(shape.checks, `${path}.checks`),
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

const readComputed = (shape: Shape, path: string): ComputedItem => {
  readOnlyKeys(shape, COMPUTED_KEYS, path)

  return {
    type: 'computed',
    key: readText(shape.key, `${path}.key`),
    label: readVaryingText(shape.label, `${path}.label`),
    valueType: readText(shape.valueType, `${path}.valueType`),
    expression: readExpression(shape.expression, `${path}.expression`),
    ...readVisibleWhen(shape, path),
  }
}

const readLeaf = (
  shape: Shape,
  { type, path }: { type: (typeof ROW_ITEM_TYPES)[number]; path: string },
): FieldItem | BlockItem | ComputedItem => {
  if (type === 'field') {
    return readField(shape, path)
  }
  return type === 'block' ? readBlock(shape, path) : readComputed(shape, path)
}

const readRowItem = (value: unknown, path: string): FieldItem | BlockItem | ComputedItem => {
  const shape = readShape(value, path)
  const type = readOneOf(shape.type, ROW_ITEM_TYPES, `${path}.type`)

  return readLeaf(shape, { type, path })
}

const readRow = (shape: Shape, path: string): RowItem => {
  readOnlyKeys(shape, ROW_KEYS, path)
  const items = readList(shape.items, `${path}.items`).map((entry, index) =>
    readRowItem(entry, `${path}.items[${index}]`),
  )

  return { type: 'row', ...readVisibleWhen(shape, path), ...readDisplay(shape, path), items }
}

const readSection = (shape: Shape, path: string): SectionItem => {
  readOnlyKeys(shape, SECTION_KEYS, path)

  return {
    type: 'section',
    label: readTranslatableText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
    ...readVisibleWhen(shape, path),
    ...readDisplay(shape, path),
    items: readItems(shape.items, `${path}.items`),
  }
}

const readItem = (value: unknown, path: string): DocumentItem => {
  const shape = readShape(value, path)
  const type = readOneOf(shape.type, ITEM_TYPES, `${path}.type`)

  if (type === 'row') {
    return readRow(shape, path)
  }
  return type === 'section' ? readSection(shape, path) : readLeaf(shape, { type, path })
}

export function readItems(value: unknown, path: string): DocumentItem[] {
  return readList(value, path).map((entry, index) => readItem(entry, `${path}[${index}]`))
}
