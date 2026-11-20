import type { FormDocument } from '../form-document'
import { insertNode } from './insert-node'
import type { Position } from './position'
import { removeNode } from './remove-node'
import { nodeAt } from './tree'

/**
 * Moves a step or item to another place in a form document, leaving the document given as it
 * was. `to` is where the node ends up, counted in the document after it was taken out, as a
 * drag and drop list reports it.
 *
 * @param document - The document.
 * @param from - Where the node sits.
 * @param to - Where it ends up.
 * @returns The document with the node moved.
 * @throws Error when no node sits at `from`, or the place at `to` does not exist or cannot hold
 *   the node.
 *
 * @example
 * ```ts
 * const next = moveNode(document, [0, 3], [1, 0])
 * ```
 */
export const moveNode = (document: FormDocument, from: Position, to: Position): FormDocument =>
  insertNode(removeNode(document, from), to, nodeAt(document, from))
