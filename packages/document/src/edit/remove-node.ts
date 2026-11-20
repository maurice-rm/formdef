import type { FormDocument } from '../form-document'
import type { Position } from '../position'
import { nodeAt } from './node-at'
import { splice } from './splice'
import { splitPosition } from './split-position'
import { updateChildren } from './update-children'

/**
 * Removes a step or item, with everything inside it, from a form document, leaving the document
 * given as it was. Conditions elsewhere that name a field removed are left as they are;
 * {@link dependentsOf} lists them beforehand, and {@link checkDocument} reports them afterwards.
 *
 * @param document - The document.
 * @param position - Where the node sits.
 * @returns The document without the node.
 * @throws When no node sits at the position.
 *
 * @example
 * ```ts
 * if (dependentsOf(document, position).length === 0) setDocument(removeNode(document, position))
 * ```
 */
export function removeNode(document: FormDocument, position: Position): FormDocument {
  // Called for its throw only: splice passes over an index with nothing there silently.
  nodeAt(document, position)
  const target = splitPosition(position)
  return updateChildren(document, target, (children) =>
    splice(children, { index: target.index, removed: 1 }),
  )
}
