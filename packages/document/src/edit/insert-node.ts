import type { DocumentNode, FormDocument } from '../form-document'
import type { Position } from '../position'
import { failAtPosition } from './fail-at-position'
import { refuseMisfit } from './refuse-misfit'
import { splice } from './splice'
import { splitPosition } from './split-position'
import { updateChildren } from './update-children'

/**
 * Inserts a step or item into a form document, leaving the document given as it was. The last
 * index of the position is where it goes among its siblings; one past the last sibling appends.
 * Whether the result is sound as a form, such as its keys being unique, {@link checkDocument}
 * reports.
 *
 * @param document - The document.
 * @param position - Where the node goes.
 * @param node - The step, section, row or field.
 * @returns The document with the node inserted.
 * @throws When the place does not exist, or cannot hold the node: steps go only into the steps of
 *   a form, a form with steps holds steps only, and a row holds fields only.
 *
 * @example
 * ```ts
 * const next = insertNode(document, [0, 2], { type: 'field', key: createKey('f'), kind: 'text', label: 'Name' })
 * ```
 */
export function insertNode(
  document: FormDocument,
  position: Position,
  node: DocumentNode,
): FormDocument {
  const target = splitPosition(position)
  return updateChildren(document, target, (children, parent) => {
    if (target.index < 0 || target.index > children.length) {
      return failAtPosition(position, 'there is no such place.')
    }
    refuseMisfit(parent, node, position)
    return splice(children, { index: target.index, removed: 0 }, node)
  })
}
