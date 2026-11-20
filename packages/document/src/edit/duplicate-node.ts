import type { Condition } from '../condition'
import type { DocumentItem, DocumentNode, DocumentStep, FormDocument } from '../form-document'
import { FORMAT_VERSION } from '../format-version'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import type { Position } from '../position'
import { createKey } from './create-key'
import { insertNode } from './insert-node'
import { nodeAt } from './node-at'
import { type Rename, renameInCondition } from './rename-in-condition'
import { renameKey } from './rename-key'

const ITEM_PREFIXES: Readonly<Record<string, string>> = {
  field: 'f',
  block: 'b',
  computed: 'c',
  repeat: 'r',
}
const STEP_PREFIX = 's'

const renamesIn = (item: DocumentItem): Rename[] => {
  const prefix = ITEM_PREFIXES[item.type]
  const own =
    prefix === undefined || !('key' in item) ? [] : [{ from: item.key, to: createKey(prefix) }]
  return [...own, ...(isLeaf(item) ? [] : item.items.flatMap(renamesIn))]
}

// A document of the items alone, so a rename reaches the copy and nothing outside it.
const renamedItems = (items: DocumentItem[], renames: readonly Rename[]): DocumentItem[] => {
  const alone: FormDocument = { format: FORMAT_VERSION, items }
  const renamed = renames.reduce<FormDocument>(
    (document, { from, to }) => renameKey(document, from, to),
    alone,
  )
  return renamed.items ?? []
}

const renamedCondition = (condition: Condition, renames: readonly Rename[]): Condition =>
  renames.reduce(renameInCondition, condition)

// A step's own key is named by nothing inside it, and its jumps go to steps and endings outside
// it, which may share a key with an item of the copy, so only their conditions follow the copy.
const copyOfStep = (step: DocumentStep): DocumentStep => {
  const { next, items, ...head } = step
  const renames = items.flatMap(renamesIn)
  return {
    ...head,
    key: createKey(STEP_PREFIX),
    items: renamedItems(items, renames),
    ...(next === undefined
      ? {}
      : { next: next.map((jump) => ({ ...jump, when: renamedCondition(jump.when, renames) })) }),
  }
}

const copyOf = (node: DocumentNode): DocumentNode => {
  if (isStep(node)) {
    return copyOfStep(node)
  }
  const [copy] = renamedItems([node], renamesIn(node))
  return copy ?? node
}

/**
 * Copies a step or item and puts the copy right after it, its labels as they are. Every key inside
 * the copy is new, and its conditions, placeholders, checks and expressions that name a field of
 * the copy name the copy's; those that name a field outside it stay. Nothing outside the copy
 * changes, the original and what names it included.
 *
 * @param document - The document.
 * @param position - Where the node sits; the copy takes the next position among its siblings.
 * @returns The document with the copy.
 * @throws When no node sits at the position.
 *
 * @example
 * ```ts
 * const next = duplicateNode(document, [1])
 * ```
 */
export function duplicateNode(document: FormDocument, position: Position): FormDocument {
  const copy = copyOf(nodeAt(document, position))
  const next = [...position.slice(0, -1), (position.at(-1) ?? 0) + 1]
  return insertNode(document, next, copy)
}
