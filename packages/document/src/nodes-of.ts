import { DOCUMENT_PATH } from './document-path'
import type { DocumentNode, FormDocument } from './form-document'
import { isField } from './is-field'
import { pathTo } from './path-to'
import type { Position } from './position'

/** A step or item of a document, with its position and where it sits. */
export type PlacedNode = {
  node: DocumentNode
  position: Position
  /** Where the node sits, as {@link checkDocument} names paths. */
  path: string
}

const nodesBelow = (node: DocumentNode, position: Position, path: string): PlacedNode[] => [
  { node, position, path },
  ...(isField(node)
    ? []
    : node.items.flatMap((child, index) =>
        nodesBelow(child, [...position, index], pathTo.entry(path, 'items', index)),
      )),
]

/** Every step and item of a document, in document order, each before the items inside it. */
export function nodesOf(document: FormDocument): PlacedNode[] {
  const [nodes, list]: [readonly DocumentNode[], 'steps' | 'items'] =
    document.steps === undefined ? [document.items, 'items'] : [document.steps, 'steps']
  return nodes.flatMap((node, index) =>
    nodesBelow(node, [index], pathTo.entry(DOCUMENT_PATH, list, index)),
  )
}
