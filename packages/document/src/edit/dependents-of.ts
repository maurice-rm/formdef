import { conditionsOf } from '../conditions-of'
import { fieldsOf } from '../fields-of'
import type { FieldItem, FormDocument } from '../form-document'
import { isField } from '../is-field'
import type { Position } from '../position'
import { fieldsNamed } from './fields-named'
import { nodeAt } from './node-at'

/** A condition that names a field of a node, as {@link dependentsOf} lists it. */
export type Dependent = {
  /** Where the condition sits, as {@link checkDocument} names paths. */
  path: string
  /** The key of the field it names. */
  field: string
}

const isWithin = (position: Position, ancestor: Position): boolean =>
  ancestor.every((index, depth) => position[depth] === index)

/**
 * Lists the conditions that name a field of a step or item, or the field itself, and would lose
 * it when the node is removed: one entry per condition and field named, in document order.
 * Conditions inside the node go with it and are left out. A builder shows them before it removes
 * the node.
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
  const fields: FieldItem[] = isField(node) ? [node] : fieldsOf(node.items)
  const keys = new Set(fields.map((field) => field.key))

  return conditionsOf(document)
    .filter((entry) => !isWithin(entry.position, position))
    .flatMap(({ condition, path }) =>
      fieldsNamed(condition)
        .filter((field) => keys.has(field))
        .map((field) => ({ path, field })),
    )
}
