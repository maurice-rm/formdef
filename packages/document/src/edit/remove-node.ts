import type { FormDocument } from '../form-document'
import type { Position } from './position'
import { nodeAt, splice, splitPosition, updateChildren } from './tree'

/**
 * Removes a step or item, with everything inside it, from a form document, leaving the document
 * given as it was. Conditions elsewhere that name a field removed are left as they are;
 * `dependentsOf` lists them beforehand, and `checkDocument` reports them afterwards.
 *
 * @param document - The document.
 * @param position - Where the node sits.
 * @returns The document without the node.
 * @throws Error when no node sits at the position.
 *
 * @example
 * ```ts
 * if (dependentsOf(document, position).length === 0) setDocument(removeNode(document, position))
 * ```
 */
export const removeNode = (document: FormDocument, position: Position): FormDocument => {
  nodeAt(document, position)
  const target = splitPosition(position)
  return updateChildren(document, target, (children) =>
    splice(children, { index: target.index, removed: 1 }),
  )
}
