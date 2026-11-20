import type { Condition } from '../condition'
import { DOCUMENT_PATH, pathTo } from '../document-path'
import type { DocumentNode, FormDocument } from '../form-document'
import { isVarying } from '../is-varying'
import { isField } from './is-field'
import type { Position } from './position'

/** One condition of a document, with the node it belongs to and where it sits. */
export type PlacedCondition = {
  condition: Condition
  /** The position of the step or item the condition belongs to. */
  position: Position
  /** Where the condition sits, as `checkDocument` names paths. */
  path: string
}

const ownConditions = (node: DocumentNode, path: string): Omit<PlacedCondition, 'position'>[] => {
  const own =
    node.visibleWhen === undefined
      ? []
      : [{ condition: node.visibleWhen, path: pathTo.visibleWhen(path) }]
  if (!isField(node)) return own

  const required =
    typeof node.required === 'object'
      ? [{ condition: node.required, path: pathTo.required(path) }]
      : []
  const cases = Object.entries(node.settings ?? {}).flatMap(([name, value]) =>
    isVarying(value)
      ? value.cases.map((entry, index) => ({
          condition: entry.when,
          path: pathTo.caseWhen(pathTo.setting(path, name), index),
        }))
      : [],
  )
  return [...own, ...required, ...cases]
}

const conditionsBelow = (
  node: DocumentNode,
  position: Position,
  path: string,
): PlacedCondition[] => [
  ...ownConditions(node, path).map((entry) => ({ ...entry, position })),
  ...(isField(node)
    ? []
    : node.items.flatMap((child, index) =>
        conditionsBelow(child, [...position, index], pathTo.entry(path, 'items', index)),
      )),
]

/** Every condition of a document, in document order: visibility, required and varying settings. */
export const conditionsOf = (document: FormDocument): PlacedCondition[] => {
  const [nodes, list]: [readonly DocumentNode[], 'steps' | 'items'] =
    document.steps === undefined ? [document.items, 'items'] : [document.steps, 'steps']
  return nodes.flatMap((node, index) =>
    conditionsBelow(node, [index], pathTo.entry(DOCUMENT_PATH, list, index)),
  )
}
