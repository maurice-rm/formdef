import type { Condition } from '../condition'
import type { DocumentNode, FieldItem, FormDocument, Varying } from '../form-document'
import { isField } from '../is-field'
import { isLeaf } from '../is-leaf'
import { isPlainObject } from '../is-plain-object'
import { isStep } from '../is-step'
import type { JsonValue } from '../json-value'
import { looksVarying } from '../looks-varying'
import { mapOptionLists } from '../map-option-lists'
import { mapStrings } from '../map-strings'
import { OWN_TEXT_KEYS } from '../own-text-keys'
import { renamePlaceholder } from '../rename-placeholder'

type Rename = { from: string; to: string }

const renameIn = (condition: Condition, rename: Rename): Condition => {
  if ('all' in condition) {
    return { all: condition.all.map((entry) => renameIn(entry, rename)) }
  }
  if ('any' in condition) {
    return { any: condition.any.map((entry) => renameIn(entry, rename)) }
  }
  const renamed = (key: string): string => (key === rename.from ? rename.to : key)
  return {
    ...condition,
    field: renamed(condition.field),
    ...(condition.valueFrom === undefined ? {} : { valueFrom: renamed(condition.valueFrom) }),
  }
}

const renameInCases = <TValue>(value: TValue, rename: Rename): TValue => {
  if (!looksVarying(value) || !Array.isArray(value.cases)) {
    return value
  }
  const cases = (value.cases as { when: Condition }[]).map((entry) => ({
    ...entry,
    when: renameIn(entry.when, rename),
  }))
  return { ...value, cases } as TValue
}

const renameInTexts = <TTexts extends { label?: unknown; description?: unknown }>(
  texts: TTexts,
  rename: Rename,
): TTexts => ({
  ...texts,
  ...(texts.label === undefined ? {} : { label: renameInCases(texts.label, rename) }),
  ...(texts.description === undefined
    ? {}
    : { description: renameInCases(texts.description, rename) }),
})

const renameInOptions = (list: readonly JsonValue[], rename: Rename): JsonValue[] =>
  list.map((option) => (isPlainObject(option) ? renameInTexts(option, rename) : option))

const renameInSetting = (value: JsonValue | Varying, rename: Rename): JsonValue | Varying =>
  mapOptionLists(renameInCases(value, rename), (list) => renameInOptions(list, rename))

const renameInSettings = (
  { settings }: { settings?: Record<string, JsonValue | Varying> },
  rename: Rename,
): { settings?: Record<string, JsonValue | Varying> } =>
  settings === undefined
    ? {}
    : {
        settings: Object.fromEntries(
          Object.entries(settings).map(([name, value]) => [name, renameInSetting(value, rename)]),
        ),
      }

const renameInField = (field: FieldItem, rename: Rename): FieldItem => ({
  ...renameInTexts(field, rename),
  ...(typeof field.required === 'object' ? { required: renameIn(field.required, rename) } : {}),
  ...renameInSettings(field, rename),
  ...(field.messages === undefined
    ? {}
    : {
        messages: Object.fromEntries(
          Object.entries(field.messages).map(([code, text]) => [code, renameInCases(text, rename)]),
        ),
      }),
  ...(field.checks === undefined
    ? {}
    : {
        checks: field.checks.map((check) => ({
          when: renameIn(check.when, rename),
          ...(check.message === undefined ? {} : { message: renameInCases(check.message, rename) }),
        })),
      }),
})

const renamePlaceholdersIn = <TNode extends DocumentNode>(node: TNode, rename: Rename): TNode => {
  const texts = node as Partial<Record<string, unknown>>
  const renamed = OWN_TEXT_KEYS.filter((name) => texts[name] !== undefined).map((name) => [
    name,
    mapStrings(texts[name], (text) => renamePlaceholder(text, rename)),
  ])
  return { ...node, ...Object.fromEntries(renamed) }
}

const renameInNode = (node: DocumentNode, rename: Rename): DocumentNode => {
  const visibility =
    node.visibleWhen === undefined ? {} : { visibleWhen: renameIn(node.visibleWhen, rename) }
  if (isLeaf(node)) {
    const own = isField(node)
      ? renameInField(node, rename)
      : { ...node, ...renameInSettings(node, rename) }
    const leaf = renamePlaceholdersIn({ ...own, ...visibility }, rename)
    return leaf.key === rename.from ? { ...leaf, key: rename.to } : leaf
  }
  const items = node.items.map((child) => renameInNode(child, rename))
  const description =
    'description' in node && node.description !== undefined
      ? { description: renameInCases(node.description, rename) }
      : {}
  const renamed = renamePlaceholdersIn(
    { ...node, ...visibility, ...description, items } as DocumentNode,
    rename,
  )
  return isStep(renamed) && renamed.key === rename.from ? { ...renamed, key: rename.to } : renamed
}

/**
 * Renames the key of a step, field or block in a form document, and the field in every condition and
 * placeholder that names it, leaving the document given as it was. A step and a field that share the key are both
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
