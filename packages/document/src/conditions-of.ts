import type { Condition } from './condition'
import { DOCUMENT_PATH } from './document-path'
import type { DocumentNode, FormDocument } from './form-document'
import { mapOwnConditions } from './map-own-conditions'
import { OUTSIDE_FORM_POSITION } from './outside-form-position'
import { pathTo } from './path-to'
import { placedNodesOf } from './placed-nodes-of'
import type { Position } from './position'

/** One condition of a document, with the node it belongs to and where it sits. */
export type PlacedCondition = {
  condition: Condition
  /** The position of the step or item the condition belongs to. */
  position: Position
  /** Where the condition sits, as {@link checkDocument} names paths. */
  path: string
}

type Placed = Omit<PlacedCondition, 'position'>

const ownConditions = (node: DocumentNode, path: string): Placed[] => {
  const found: Placed[] = []
  mapOwnConditions(node, path, (condition, at) => {
    found.push({ condition, path: at })
    return condition
  })
  return found
}

/**
 * Every condition of a document, in document order, those of its intro first and of its endings
 * last: visibility, required, texts and error texts that follow an answer, settings that follow an
 * answer with the texts of their options, and the conditions of expressions.
 */
export function conditionsOf(document: FormDocument): PlacedCondition[] {
  const ofNodes = placedNodesOf(document).flatMap(({ node, position, path }) =>
    ownConditions(node, path).map((entry) => ({ ...entry, position })),
  )
  const ofEndings = (document.endings ?? []).flatMap((ending, index) =>
    ending.when === undefined
      ? []
      : [
          {
            condition: ending.when,
            path: `${pathTo.entry(DOCUMENT_PATH, 'endings', index)}.when`,
            position: OUTSIDE_FORM_POSITION,
          },
        ],
  )
  return [...ofNodes, ...ofEndings]
}
