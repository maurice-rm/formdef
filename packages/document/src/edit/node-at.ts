import { findNodeAt } from '../find-node-at'
import type { DocumentNode, FormDocument } from '../form-document'
import type { Position } from '../position'
import { failAtPosition } from './fail-at-position'

/**
 * The node at a position.
 *
 * @throws When no node sits there.
 */
export function nodeAt(document: FormDocument, position: Position): DocumentNode {
  return findNodeAt(document, position) ?? failAtPosition(position, 'there is nothing here.')
}
