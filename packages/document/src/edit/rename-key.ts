import type { Condition } from '../condition'
import type { Expression } from '../expression'
import type {
  BlockItem,
  ComputedItem,
  DocumentNode,
  Ending,
  FieldItem,
  FormDocument,
  Jump,
  Varying,
} from '../form-document'
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
import { type Rename, renameInCondition } from './rename-in-condition'

const renamedKey = (key: string, rename: Rename): string => (key === rename.from ? rename.to : key)

const renameInCases = <TValue>(value: TValue, rename: Rename): TValue => {
  if (!looksVarying(value) || !Array.isArray(value.cases)) {
    return value
  }
  const cases = (value.cases as { when: Condition }[]).map((entry) => ({
    ...entry,
    when: renameInCondition(entry.when, rename),
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
  ...(typeof field.required === 'object'
    ? { required: renameInCondition(field.required, rename) }
    : {}),
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
          when: renameInCondition(check.when, rename),
          ...(check.message === undefined ? {} : { message: renameInCases(check.message, rename) }),
        })),
      }),
})

const renameInExpression = (expression: Expression, rename: Rename): Expression => {
  if ('field' in expression) {
    const when =
      'when' in expression && expression.when !== undefined
        ? { when: renameInCondition(expression.when, rename) }
        : {}
    return { ...expression, field: renamedKey(expression.field, rename), ...when }
  }
  if ('cases' in expression) {
    return {
      cases: expression.cases.map((entry) => ({
        when: renameInCondition(entry.when, rename),
        value: renameInExpression(entry.value, rename),
      })),
      otherwise: renameInExpression(expression.otherwise, rename),
    }
  }
  if ('args' in expression) {
    return { ...expression, args: expression.args.map((arg) => renameInExpression(arg, rename)) }
  }
  return expression
}

const renameInComputed = (computed: ComputedItem, rename: Rename): ComputedItem => ({
  ...renameInTexts(computed, rename),
  expression: renameInExpression(computed.expression, rename),
})

const renamePlaceholdersIn = <TNode extends DocumentNode>(node: TNode, rename: Rename): TNode => {
  const texts = node as Partial<Record<string, unknown>>
  const renamed = OWN_TEXT_KEYS.filter((name) => texts[name] !== undefined).map((name) => [
    name,
    mapStrings(texts[name], (text) => renamePlaceholder(text, rename)),
  ])
  return { ...node, ...Object.fromEntries(renamed) }
}

const renameInJump = (jump: Jump, rename: Rename): Jump => {
  const when = renameInCondition(jump.when, rename)
  return jump.end === undefined
    ? { when, step: renamedKey(jump.step, rename) }
    : { when, end: renamedKey(jump.end, rename) }
}

const renameInEnding = (ending: Ending, rename: Rename): Ending => ({
  key: renamedKey(ending.key, rename),
  ...(ending.when === undefined ? {} : { when: renameInCondition(ending.when, rename) }),
  items: ending.items.map((block) => renameInNode(block, rename) as BlockItem),
})

const withRenamedKey = <TNode extends DocumentNode>(node: TNode, rename: Rename): TNode =>
  'key' in node && node.key === rename.from ? { ...node, key: rename.to } : node

const renameInNode = (node: DocumentNode, rename: Rename): DocumentNode => {
  const visibility =
    node.visibleWhen === undefined
      ? {}
      : { visibleWhen: renameInCondition(node.visibleWhen, rename) }
  if (isLeaf(node)) {
    const own = isField(node)
      ? renameInField(node, rename)
      : node.type === 'computed'
        ? renameInComputed(node, rename)
        : { ...node, ...renameInSettings(node, rename) }
    return withRenamedKey(renamePlaceholdersIn({ ...own, ...visibility }, rename), rename)
  }
  const items = node.items.map((child) => renameInNode(child, rename))
  const description =
    'description' in node && node.description !== undefined
      ? { description: renameInCases(node.description, rename) }
      : {}
  const jumps =
    isStep(node) && node.next !== undefined
      ? {
          next: node.next.map((jump) => renameInJump(jump, rename)),
        }
      : {}
  const renamed = renamePlaceholdersIn(
    { ...node, ...visibility, ...description, ...jumps, items } as DocumentNode,
    rename,
  )
  return withRenamedKey(renamed, rename)
}

/**
 * Renames the key of a step, field, block, computed value, repeat or ending in a form document, and the key
 * in every condition, expression, jump and placeholder that names it, endings included, leaving the
 * document given as it was. Keys of different kinds that are the same are all renamed. A key that is taken already, or not a plain name, {@link checkDocument} reports
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
  const endings =
    document.endings === undefined
      ? {}
      : { endings: document.endings.map((ending) => renameInEnding(ending, rename)) }
  const intro =
    document.intro === undefined
      ? {}
      : {
          intro: {
            ...document.intro,
            items: document.intro.items.map((block) => renameInNode(block, rename) as BlockItem),
          },
        }
  return document.steps === undefined
    ? {
        ...document,
        ...intro,
        ...endings,
        items: document.items.map((item) => renameInNode(item, rename) as typeof item),
      }
    : {
        ...document,
        ...intro,
        ...endings,
        steps: document.steps.map((step) => renameInNode(step, rename) as typeof step),
      }
}
