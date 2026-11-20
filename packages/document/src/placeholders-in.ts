import { DOCUMENT_PATH } from './document-path'
import type { BlockItem, FormDocument } from './form-document'
import { nodesOf } from './nodes-of'
import { OUTSIDE_FORM_POSITION } from './outside-form-position'
import { OWN_TEXT_KEYS } from './own-text-keys'
import { pathTo } from './path-to'
import { placeholdersOf } from './placeholders-of'
import type { Position } from './position'
import { stringsIn } from './strings-in'

/** A placeholder of a document: the field it names, with the node and the text it sits in. */
export type PlacedPlaceholder = {
  field: string
  /** The position of the step or item whose text holds it. */
  position: Position
  /** Where the text sits, as {@link checkDocument} names paths. */
  path: string
}

/**
 * Every placeholder of a document, in document order: in the labels, descriptions and settings of
 * its steps and items, with their translations and cases, with the blocks of its intro first and of
 * its endings last.
 */
export function placeholdersIn(document: FormDocument): PlacedPlaceholder[] {
  const placedBlocks = (blocks: readonly BlockItem[], path: string) =>
    blocks.map((block, index) => ({
      node: block,
      position: OUTSIDE_FORM_POSITION,
      path: `${path}.items[${index}]`,
    }))
  const blocksOfIntro = placedBlocks(document.intro?.items ?? [], `${DOCUMENT_PATH}.intro`)
  const blocksOfEndings = (document.endings ?? []).flatMap((ending, index) =>
    placedBlocks(ending.items, pathTo.entry(DOCUMENT_PATH, 'endings', index)),
  )
  const placed = [...blocksOfIntro, ...nodesOf(document), ...blocksOfEndings]
  return placed.flatMap(({ node, position, path }) =>
    OWN_TEXT_KEYS.flatMap((name) =>
      stringsIn((node as Partial<Record<string, unknown>>)[name], `${path}.${name}`),
    ).flatMap(({ text, path: textPath }) =>
      placeholdersOf(text).map((field) => ({ field, position, path: textPath })),
    ),
  )
}
