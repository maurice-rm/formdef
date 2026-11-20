import type { FormDocument } from './form-document'
import { nodesOf } from './nodes-of'
import { OWN_TEXT_KEYS } from './own-text-keys'
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
 * its steps and items, with their translations and cases.
 */
export function placeholdersIn(document: FormDocument): PlacedPlaceholder[] {
  return nodesOf(document).flatMap(({ node, position, path }) =>
    OWN_TEXT_KEYS.flatMap((name) =>
      stringsIn((node as Partial<Record<string, unknown>>)[name], `${path}.${name}`),
    ).flatMap(({ text, path: textPath }) =>
      placeholdersOf(text).map((field) => ({ field, position, path: textPath })),
    ),
  )
}
