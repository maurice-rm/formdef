import type { Condition } from '../condition'
import type { DocumentItem, FieldItem, FormDocument, JsonValue } from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { FieldKinds } from '../kinds/create-field-kinds'
import type { FieldKind } from '../kinds/field-kind'
import { fitsValueType, isFilled } from './answer-value'
import type { Answer } from './answers'
import { holds } from './holds'
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

type Walk = {
  kinds: FieldKinds<unknown>
  answers: Map<string, Answer>
  shown: ShownField[]
}

type Container = {
  values: Readonly<Record<string, unknown>>
  path: readonly string[]
}

const objectOf = (value: unknown): Readonly<Record<string, unknown>> =>
  isPlainObject(value) ? value : {}

const isShown = (item: { visibleWhen?: Condition }, walk: Walk): boolean =>
  item.visibleWhen === undefined || holds(item.visibleWhen, walk.answers)

const isRequired = (field: FieldItem, walk: Walk): boolean =>
  typeof field.required === 'object' ? holds(field.required, walk.answers) : field.required === true

const walkField = (field: FieldItem, container: Container, walk: Walk): void => {
  const kind = walk.kinds.byName(field.kind)
  if (kind === undefined) {
    throw new Error(`formdef: ${field.key}.kind: the field kind ${field.kind} is not registered.`)
  }
  const value = container.values[field.key]

  walk.shown.push({
    field,
    kind,
    path: [...container.path, field.key],
    value,
    isRequired: isRequired(field, walk),
    settings: resolveSettings(field, walk.answers),
  })
  if (isFilled(value, kind.valueType) && fitsValueType(value, kind.valueType)) {
    walk.answers.set(field.key, { value, valueType: kind.valueType })
  }
}

const walkItems = (items: readonly DocumentItem[], container: Container, walk: Walk): void => {
  for (const item of items) {
    if (!isShown(item, walk)) continue
    if (item.type === 'field') walkField(item, container, walk)
    else walkItems(item.items, container, walk)
  }
}

/**
 * The fields that show for these values, in document order. A field shows when it and every
 * step, section and row around it show; a field that does not show counts as empty in the
 * conditions after it, whatever value it still holds.
 *
 * @throws Error when a field is of a field kind that is not registered.
 */
export const shownFieldsOf = (
  document: FormDocument,
  kinds: FieldKinds<unknown>,
  values: unknown,
): ShownField[] => {
  const walk: Walk = { kinds, answers: new Map(), shown: [] }
  const root = objectOf(values)

  if (document.steps === undefined) {
    walkItems(document.items, { values: root, path: [] }, walk)
    return walk.shown
  }
  for (const step of document.steps) {
    if (!isShown(step, walk)) continue
    walkItems(step.items, { values: objectOf(root[step.key]), path: [step.key] }, walk)
  }
  return walk.shown
}
