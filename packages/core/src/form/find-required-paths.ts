import type { StandardSchemaV1 } from '@tanstack/react-form'

import { byName } from '../render/by-name'
import { childPath } from '../render/child-path'
import { pathPattern } from '../render/path-pattern'
import { splitEntry } from '../render/split-entry'
import { declaresEmptyValue } from '../widget/declares-empty-value'

type LevelFields = Readonly<Record<string, object>>

type Widgets = Readonly<Record<string, object>>

type RequiredPathsInput = {
  schema: unknown
  /** Whether the config validates the schema asynchronously (`validation.async`). */
  validatesAsync: boolean
  fields: LevelFields
  widgets: Widgets
}

/** The path patterns of the required fields, or why none could be found. */
type RequiredPathsResult = { paths: ReadonlySet<string> } | { problem: string }

type EmptyValues = {
  widgets: Widgets
  /** The path patterns of the leaves whose widget declares an empty value. */
  declared: Set<string>
}

type Validation = ReturnType<StandardSchemaV1['~standard']['validate']>
type Issue = NonNullable<Exclude<Validation, Promise<unknown>>['issues']>[number]

const NONE: RequiredPathsResult = { paths: new Set() }

const ASYNC_SCHEMA =
  'formdef: the schema validates asynchronously, so no field is found to be required; pass required in props.'
const UNSETTLED_SCHEMA =
  'formdef: the schema did not validate empty values synchronously, so no field is found to be required; pass required in props.'
const THROWING_SCHEMA =
  'formdef: the schema threw on empty values, so no field is found to be required'

const FIRST_ITEM = 0

const isStandardSchema = (schema: unknown): schema is StandardSchemaV1 =>
  typeof schema === 'object' && schema !== null && '~standard' in schema

const emptyLevel = (fields: LevelFields, path: string | undefined, empty: EmptyValues): object =>
  Object.fromEntries(
    Object.entries(fields).map(([key, entry]) => [
      key,
      emptyEntry(entry, childPath(path, key), empty),
    ]),
  )

function emptyEntry(entry: object, path: string, empty: EmptyValues): unknown {
  const { own } = splitEntry(entry)

  if (typeof own.widget === 'string') {
    const widget = byName(empty.widgets, own.widget)
    if (widget === undefined || !declaresEmptyValue(widget)) {
      return undefined
    }
    empty.declared.add(pathPattern(path))

    return widget.emptyValue
  }
  if (typeof own.item === 'object' && own.item !== null) {
    return [emptyEntry(own.item, childPath(path, FIRST_ITEM), empty)]
  }
  if (typeof own.fields === 'object' && own.fields !== null) {
    return emptyLevel(own.fields as LevelFields, path, empty)
  }

  return undefined
}

const issuePath = (issue: Issue): string =>
  pathPattern(
    (issue.path ?? []).reduce<string | undefined>((parent, segment) => {
      const key = typeof segment === 'object' ? segment.key : segment

      return childPath(parent, typeof key === 'number' ? key : String(key))
    }, undefined) ?? '',
  )

// The promise is dropped unread; a rejection is the schema failing on empty values, not the form.
const ignoreRejection = (): undefined => undefined

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/**
 * Finds the required fields of a config: validates `schema` once, synchronously, with every leaf
 * holding its widget's empty value and every array one such item. A leaf whose widget declares an
 * empty value and whose path receives an issue is required. A schema the config validates
 * asynchronously is not run, so its asynchronous checks send nothing.
 */
export function findRequiredPaths({
  schema,
  validatesAsync,
  fields,
  widgets,
}: RequiredPathsInput): RequiredPathsResult {
  if (!isStandardSchema(schema)) {
    return NONE
  }
  if (validatesAsync) {
    return { problem: ASYNC_SCHEMA }
  }

  const empty: EmptyValues = { widgets, declared: new Set() }
  const values = emptyLevel(fields, undefined, empty)
  let result: Validation
  try {
    result = schema['~standard'].validate(values)
  } catch (error) {
    return { problem: `${THROWING_SCHEMA}: ${errorText(error)}` }
  }
  if (result instanceof Promise) {
    result.then(undefined, ignoreRejection)

    return { problem: UNSETTLED_SCHEMA }
  }

  const issuePaths = (result.issues ?? []).map(issuePath)

  return { paths: new Set(issuePaths.filter((path) => empty.declared.has(path))) }
}
