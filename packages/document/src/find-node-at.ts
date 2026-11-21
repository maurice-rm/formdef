import type { DocumentNode, FormDocument } from './form-document'
import { isLeaf } from './is-leaf'
import type { Position } from './position'

/** The step or item at a position, or `undefined` when nothing sits there. */
export function findNodeAt(document: FormDocument, position: Position): DocumentNode | undefined {
  const [first, ...rest] = position
  if (first === undefined) {
    return undefined
  }
  let node: DocumentNode | undefined = (document.steps ?? document.items)[first]
  for (const index of rest) {
    node = node === undefined || isLeaf(node) ? undefined : node.items[index]
  }
  return node
}
