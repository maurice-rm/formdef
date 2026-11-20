import type { DocumentNode, FormDocument } from '../form-document'
import type { Position } from './position'
import { nodeAt, refuseMisfit, splice, splitPosition, updateChildren } from './tree'

/**
 * Replaces a step or item of a form document with what `update` returns, such as the field with
 * a new label, leaving the document given as it was.
 *
 * @param document - The document.
 * @param position - Where the node sits.
 * @param update - Takes the node and returns the one that replaces it.
 * @returns The document with the node replaced.
 * @throws Error when no node sits at the position, or its place cannot hold the new node.
 *
 * @example
 * ```ts
 * const next = updateNode(document, position, (node) => ({ ...node, label: 'House type' }))
 * ```
 */
export const updateNode = (
  document: FormDocument,
  position: Position,
  update: (node: DocumentNode) => DocumentNode,
): FormDocument => {
  const replacement = update(nodeAt(document, position))
  const target = splitPosition(position)
  return updateChildren(document, target, (children, parent) => {
    refuseMisfit(parent, replacement, position)
    return splice(children, { index: target.index, removed: 1 }, replacement)
  })
}
