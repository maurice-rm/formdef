import type { DocumentNode, FormDocument } from '../form-document'
import type { Position } from '../position'
import { childrenOf } from './children-of'
import { failAtPosition } from './fail-at-position'
import { isDocument } from './is-document'
import type { Parent } from './parent'

/**
 * The node at a position.
 *
 * @throws When no node sits there.
 */
export function nodeAt(document: FormDocument, position: Position): DocumentNode {
  let node: Parent = document
  for (const index of position) {
    node = childrenOf(node)?.[index] ?? failAtPosition(position, 'there is nothing here.')
  }
  return isDocument(node) ? failAtPosition(position, 'there is nothing here.') : node
}
