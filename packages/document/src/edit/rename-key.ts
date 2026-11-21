import type { Expression } from '../expression'
import type { BlockItem, DocumentNode, Ending, FormDocument, Jump } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import { mapOwnConditions } from '../map-own-conditions'
import { mapStrings } from '../map-strings'
import { OWN_TEXT_KEYS } from '../own-text-keys'
import { renamePlaceholder } from '../rename-placeholder'
import type { Rename } from './rename'
import { renameInCondition } from './rename-in-condition'
import { renamedKey } from './renamed-key'

// The conditions inside an expression are renamed with the node's; here the fields it reads.
const renameFieldsIn = (expression: Expression, rename: Rename): Expression => {
  if ('field' in expression) {
    return { ...expression, field: renamedKey(expression.field, rename) }
  }
  if ('cases' in expression) {
    return {
      cases: expression.cases.map((entry) => ({
        ...entry,
        value: renameFieldsIn(entry.value, rename),
      })),
      otherwise: renameFieldsIn(expression.otherwise, rename),
    }
  }
  if ('args' in expression) {
    return { ...expression, args: expression.args.map((arg) => renameFieldsIn(arg, rename)) }
  }
  return expression
}

const renamePlaceholdersIn = <TNode extends DocumentNode>(node: TNode, rename: Rename): TNode => {
  const texts = node as Partial<Record<string, unknown>>
  const renamed = OWN_TEXT_KEYS.filter((name) => texts[name] !== undefined).map((name) => [
    name,
    mapStrings(texts[name], (text) => renamePlaceholder(text, rename)),
  ])
  return { ...node, ...Object.fromEntries(renamed) }
}

const renameJumpTarget = (jump: Jump, rename: Rename): Jump =>
  jump.end === undefined
    ? { ...jump, step: renamedKey(jump.step, rename) }
    : { ...jump, end: renamedKey(jump.end, rename) }

const withRenamedKey = <TNode extends DocumentNode>(node: TNode, rename: Rename): TNode =>
  'key' in node && node.key === rename.from ? { ...node, key: rename.to } : node

const renameInNode = <TNode extends DocumentNode>(node: TNode, rename: Rename): TNode => {
  const conditions = mapOwnConditions(node, '', (condition) => renameInCondition(condition, rename))
  if (isLeaf(conditions)) {
    const own =
      conditions.type === 'computed'
        ? { ...conditions, expression: renameFieldsIn(conditions.expression, rename) }
        : conditions
    return withRenamedKey(renamePlaceholdersIn(own, rename), rename) as TNode
  }
  const items = conditions.items.map((child) => renameInNode(child, rename))
  const jumps =
    isStep(conditions) && conditions.next !== undefined
      ? { next: conditions.next.map((jump) => renameJumpTarget(jump, rename)) }
      : {}
  const renamed = renamePlaceholdersIn({ ...conditions, ...jumps, items } as DocumentNode, rename)
  return withRenamedKey(renamed, rename) as TNode
}

const renameInEnding = (ending: Ending, rename: Rename): Ending => ({
  key: renamedKey(ending.key, rename),
  ...(ending.when === undefined ? {} : { when: renameInCondition(ending.when, rename) }),
  items: ending.items.map((block): BlockItem => renameInNode(block, rename)),
})

/**
 * Renames the key of a step, field, block, computed value, repeat or ending in a form document, and
 * the key in every condition, expression, jump and placeholder that names it, endings included,
 * leaving the document given as it was. Keys of different kinds that are the same are all renamed.
 * A key that is taken already, or not a plain name, {@link checkDocument} reports afterwards.
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
            items: document.intro.items.map((block) => renameInNode(block, rename)),
          },
        }
  return document.steps === undefined
    ? {
        ...document,
        ...intro,
        ...endings,
        items: document.items.map((item) => renameInNode(item, rename)),
      }
    : {
        ...document,
        ...intro,
        ...endings,
        steps: document.steps.map((step) => renameInNode(step, rename)),
      }
}
