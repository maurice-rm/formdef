import { DOCUMENT_PATH } from './document-path'
import type { BlockItem, FormDocument } from './form-document'
import { nodesOf, type PlacedNode } from './nodes-of'
import { OUTSIDE_FORM_POSITION } from './outside-form-position'
import { pathTo } from './path-to'

const placedBlocks = (blocks: readonly BlockItem[], path: string): PlacedNode[] =>
  blocks.map((block, index) => ({
    node: block,
    position: OUTSIDE_FORM_POSITION,
    path: pathTo.entry(path, 'items', index),
  }))

/**
 * Every node of a document that may hold conditions or texts, in document order: the blocks of
 * its intro, its steps and items as {@link nodesOf} lists them, then the blocks of its endings,
 * which sit at no position.
 */
export function placedNodesOf(document: FormDocument): PlacedNode[] {
  const ofIntro = placedBlocks(document.intro?.items ?? [], `${DOCUMENT_PATH}.intro`)
  const ofEndings = (document.endings ?? []).flatMap((ending, index) =>
    placedBlocks(ending.items, pathTo.entry(DOCUMENT_PATH, 'endings', index)),
  )
  return [...ofIntro, ...nodesOf(document), ...ofEndings]
}
