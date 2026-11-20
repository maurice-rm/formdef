import type { Condition } from '../condition'
import { fieldsOf } from '../fields-of'
import type { DocumentItem, FieldItem, FormDocument } from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import type { Catalog } from '../kinds/create-catalog'
import type { FieldKind } from '../kinds/field-kind'
import { kindOf } from '../kinds/kind-of'
import type { ValueType } from '../kinds/value-type'
import type { Answer, Answers } from './answers'
import { holds } from './holds'
import { isFilled } from './is-filled'
import { isRequired } from './is-required'
import { resolveSettings } from './resolve-settings'

/** A field that shows for the values given, with what its answer is checked against. */
export type ShownField = {
  field: FieldItem
  kind: FieldKind<unknown>
  /** Where the field's value sits: the step key and field key, or the field key alone. */
  path: readonly string[]
  value: unknown
  isRequired: boolean
  settings: Readonly<Record<string, JsonValue>>
}

/** What a document's values come to: the fields that show, and the answers conditions compare. */
export type Evaluation = {
  /** The fields that show, in document order. */
  shown: ShownField[]
  answers: Answers
}

/** The values a document is evaluated for, and the language its texts are resolved in. */
export type EvaluationInput = {
  values: unknown
  /** The language, as {@link languageOf} chose it; `undefined` for a document of strings. */
  language: string | undefined
}

type EvaluationWalk = {
  catalog: Catalog<unknown, ValueType>
  language: string | undefined
  filled: Map<string, Answer>
  answers: Answers
  shown: ShownField[]
}

type Container = {
  values: Readonly<Record<string, unknown>>
  path: readonly string[]
}

const objectOf = (value: unknown): Readonly<Record<string, unknown>> =>
  isPlainObject(value) ? value : {}

const isShown = (item: { visibleWhen?: Condition }, walk: EvaluationWalk): boolean =>
  item.visibleWhen === undefined || holds(item.visibleWhen, walk.answers)

const walkField = (field: FieldItem, container: Container, walk: EvaluationWalk): void => {
  const kind = kindOf(walk.catalog, field)
  const value = container.values[field.key]

  walk.shown.push({
    field,
    kind,
    path: [...container.path, field.key],
    value,
    isRequired: isRequired(field, walk.answers),
    settings: resolveSettings(field, kind, { answers: walk.answers, language: walk.language }),
  })
  if (isFilled(value, kind.valueType)) {
    walk.filled.set(field.key, { value, valueType: kind.valueType })
  }
}

const valueTypesOf = (
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
): ReadonlyMap<string, ValueType> => {
  const items =
    document.steps === undefined ? document.items : document.steps.flatMap((step) => step.items)
  return new Map(
    fieldsOf(items).flatMap((field) => {
      const kind = catalog.findFieldKind(field.kind)
      return kind === undefined ? [] : [[field.key, kind.valueType] as const]
    }),
  )
}

const walkItems = (
  items: readonly DocumentItem[],
  container: Container,
  walk: EvaluationWalk,
): void => {
  for (const item of items) {
    if (!isShown(item, walk)) {
      continue
    }
    if (item.type === 'field') {
      walkField(item, container, walk)
    } else {
      walkItems(item.items, container, walk)
    }
  }
}

/**
 * Evaluates a document for these values, its settings resolved in the language. A field shows
 * when it and every step, section and row around it show; a field that does not show counts as
 * empty in the conditions after it, whatever value it still holds.
 *
 * @throws When a field is of a field kind that is not registered.
 */
export function evaluate(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  { values, language }: EvaluationInput,
): Evaluation {
  const filled = new Map<string, Answer>()
  const valueTypes = valueTypesOf(document, catalog)
  const answers: Answers = {
    get: (key) => filled.get(key),
    valueTypeOf: (key) => valueTypes.get(key),
  }
  const walk: EvaluationWalk = { catalog, language, filled, answers, shown: [] }
  const root = objectOf(values)

  if (document.steps === undefined) {
    walkItems(document.items, { values: root, path: [] }, walk)
    return walk
  }
  for (const step of document.steps) {
    if (!isShown(step, walk)) {
      continue
    }
    walkItems(step.items, { values: objectOf(root[step.key]), path: [step.key] }, walk)
  }
  return walk
}
