import type { DocumentNode, FormDocument } from '../form-document'
import type { Position } from './position'
import { failAt, fitsInto, splice, splitPosition, updateChildren } from './tree'

/**
 * Inserts a step or item into a form document, leaving the document given as it was. The last
 * index of the position is where it goes among its siblings; one past the last sibling appends.
 * Whether the result is sound as a form, such as its keys being unique, `checkDocument` reports.
 *
 * @param document - The document.
 * @param position - Where the node goes.
 * @param node - The step, section, row or field.
 * @returns The document with the node inserted.
 * @throws Error when the place does not exist, or cannot hold the node: steps go only into the
 *   steps of a form, a form with steps holds steps only, and a row holds fields only.
 *
 * @example
 * ```ts
 * const next = insertNode(document, [0, 2], { type: 'field', key: createKey('f'), kind: 'text', label: 'Name' })
 * ```
 */
export const insertNode = (
  document: FormDocument,
  position: Position,
  node: DocumentNode,
): FormDocument => {
  const target = splitPosition(position)
  return updateChildren(document, target, (children, parent) => {
    if (target.index < 0 || target.index > children.length) {
      return failAt(position, 'there is no such place.')
    }
    fitsInto(parent, node, position)
    return splice(children, { index: target.index, removed: 0 }, node)
  })
}
