import { answerItemsOf } from '../answer-items-of'
import { conditionsOf } from '../conditions-of'
import type { DocumentNode, FormDocument } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import { nodesOf } from '../nodes-of'
import { placeholdersIn } from '../placeholders-in'
import type { Position } from '../position'
import { repeatsOf } from '../repeats-of'
import { fieldsNamed } from './fields-named'
import { fieldsReadBy } from './fields-read-by'
import { nodeAt } from './node-at'

/** A condition, placeholder or expression that names a field of a node, as {@link dependentsOf} lists it. */
export type Dependent = {
  /** Where the condition, text or expression sits, as {@link checkDocument} names paths. */
  path: string
  /** The key of the field or computed value it names. */
  field: string
}

const isWithin = (position: Position, ancestor: Position): boolean =>
  ancestor.every((index, depth) => position[depth] === index)

// A repeat is named by its key, which conditions compare by its number of entries.
const namedKeysUnder = (node: DocumentNode): string[] => {
  if (isLeaf(node)) {
    return node.type === 'block' ? [] : [node.key]
  }
  const own = !isStep(node) && node.type === 'repeat' ? [node.key] : []
  return [
    ...own,
    ...[...answerItemsOf(node.items), ...repeatsOf(node.items)].map((item) => item.key),
  ]
}

/**
 * Lists the conditions, placeholders and expressions that name a field, computed value or repeat of
 * a step or item, or the item itself, and would lose it when the node is removed: one entry per
 * condition and key named, in document order, then one per placeholder, then one per expression.
 * Those inside the node go with it and are left out. A builder shows them before it removes the
 * node.
 *
 * @param document - The document.
 * @param position - Where the node sits.
 * @returns The conditions that depend on the node's fields; empty when none do.
 * @throws When no node sits at the position.
 *
 * @example
 * ```ts
 * const dependents = dependentsOf(document, position)
 * if (dependents.length > 0) askBeforeRemoving(dependents)
 * ```
 */
export function dependentsOf(document: FormDocument, position: Position): Dependent[] {
  const node = nodeAt(document, position)
  const keys = new Set(namedKeysUnder(node))

  const fromConditions = conditionsOf(document)
    .filter((entry) => !isWithin(entry.position, position))
    .flatMap(({ condition, path }) =>
      fieldsNamed(condition)
        .filter((field) => keys.has(field))
        .map((field) => ({ path, field })),
    )
  const fromPlaceholders = placeholdersIn(document)
    .filter((entry) => !isWithin(entry.position, position) && keys.has(entry.field))
    .map(({ path, field }) => ({ path, field }))
  const fromExpressions = nodesOf(document)
    .filter((entry) => !isWithin(entry.position, position))
    .flatMap(({ node: other, path }) =>
      !isStep(other) && other.type === 'computed'
        ? fieldsReadBy(other.expression)
            .filter((field) => keys.has(field))
            .map((field) => ({ path: `${path}.expression`, field }))
        : [],
    )
  return [...fromConditions, ...fromPlaceholders, ...fromExpressions]
}
