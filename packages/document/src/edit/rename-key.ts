import type { Condition } from '../condition'
import type { DocumentNode, FieldItem, FormDocument, Varying } from '../form-document'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import { isField } from './is-field'
import { isStep } from './is-step'

type Rename = { from: string; to: string }

const renameIn = (condition: Condition, rename: Rename): Condition => {
  if ('all' in condition) {
    return { all: condition.all.map((entry) => renameIn(entry, rename)) }
  }
  if ('any' in condition) {
    return { any: condition.any.map((entry) => renameIn(entry, rename)) }
  }
  return condition.field === rename.from ? { ...condition, field: rename.to } : condition
}

const renameInSetting = (value: JsonValue | Varying, rename: Rename): JsonValue | Varying =>
  isVarying(value)
    ? {
        ...value,
        cases: value.cases.map((entry) => ({ ...entry, when: renameIn(entry.when, rename) })),
      }
    : value

const renameInField = (field: FieldItem, rename: Rename): FieldItem => ({
  ...field,
  ...(typeof field.required === 'object' ? { required: renameIn(field.required, rename) } : {}),
  ...(field.settings === undefined
    ? {}
    : {
        settings: Object.fromEntries(
          Object.entries(field.settings).map(([name, value]) => [
            name,
            renameInSetting(value, rename),
          ]),
        ),
      }),
})

const renameInNode = (node: DocumentNode, rename: Rename): DocumentNode => {
  const visibility =
    node.visibleWhen === undefined ? {} : { visibleWhen: renameIn(node.visibleWhen, rename) }
  if (isField(node)) {
    const field = { ...renameInField(node, rename), ...visibility }
    return field.key === rename.from ? { ...field, key: rename.to } : field
  }
  const items = node.items.map((child) => renameInNode(child, rename))
  const renamed = { ...node, ...visibility, items } as DocumentNode
  return isStep(renamed) && renamed.key === rename.from ? { ...renamed, key: rename.to } : renamed
}

/**
 * Renames the key of a step or field in a form document, and the field in every condition that
 * names it, leaving the document given as it was. A step and a field that share the key are both
 * renamed. A key that is taken already, or not a plain name, {@link checkDocument} reports
 * afterwards.
 *
 * @param document - The document.
 * @param from - The key now.
 * @param to - The new key.
 * @returns The document with the key renamed.
 *
 * @example
 * ```ts
 * const next = renameKey(document, 'f1', 'houseType')
 * ```
 */
export function renameKey(document: FormDocument, from: string, to: string): FormDocument {
  const rename = { from, to }
  return document.steps === undefined
    ? {
        ...document,
        items: document.items.map((item) => renameInNode(item, rename) as typeof item),
      }
    : {
        ...document,
        steps: document.steps.map((step) => renameInNode(step, rename) as typeof step),
      }
}
