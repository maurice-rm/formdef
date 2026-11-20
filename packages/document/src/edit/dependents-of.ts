import { fieldsOf } from '../fields-of'
import type { FieldItem, FormDocument } from '../form-document'
import { conditionsOf } from './conditions-of'
import { fieldsNamed } from './fields-named'
import type { Position } from './position'
import { isStep, nodeAt } from './tree'

/** A condition that names a field of a node, as `dependentsOf` lists it. */
export type Dependent = {
  /** Where the condition sits, as `checkDocument` names paths. */
  path: string
  /** The key of the field it names. */
  field: string
}

const isWithin = (position: readonly number[], ancestor: readonly number[]): boolean =>
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
 * @throws Error when no node sits at the position.
 *
 * @example
 * ```ts
 * const dependents = dependentsOf(document, position)
 * if (dependents.length > 0) askBeforeRemoving(dependents)
 * ```
 */
export const dependentsOf = (document: FormDocument, position: Position): Dependent[] => {
  const node = nodeAt(document, position)
  const fields: FieldItem[] = isStep(node) || node.type !== 'field' ? fieldsOf(node.items) : [node]
  const keys = new Set(fields.map((field) => field.key))

  return conditionsOf(document)
    .filter((entry) => !isWithin(entry.position, position))
    .flatMap(({ condition, path }) =>
      fieldsNamed(condition)
        .filter((field) => keys.has(field))
        .map((field) => ({ path, field })),
    )
}
