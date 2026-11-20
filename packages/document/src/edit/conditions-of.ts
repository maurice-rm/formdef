import type { Condition } from '../condition'
import type { DocumentNode, FormDocument } from '../form-document'
import { isVarying } from '../is-varying'
import type { Position } from './position'
import { isStep } from './tree'

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
      : [{ condition: node.visibleWhen, path: `${path}.visibleWhen` }]
  if (isStep(node) || node.type !== 'field') return own

  const required =
    typeof node.required === 'object'
      ? [{ condition: node.required, path: `${path}.required` }]
      : []
  const cases = Object.entries(node.settings ?? {}).flatMap(([name, value]) =>
    isVarying(value)
      ? value.cases.map((entry, index) => ({
          condition: entry.when,
          path: `${path}.settings.${name}.cases[${index}].when`,
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
  ...(isStep(node) || node.type !== 'field'
    ? node.items.flatMap((child, index) =>
        conditionsBelow(child, [...position, index], `${path}.items[${index}]`),
      )
    : []),
]

/** Every condition of a document, in document order: visibility, required and varying settings. */
export const conditionsOf = (document: FormDocument): PlacedCondition[] => {
  const [nodes, name]: [readonly DocumentNode[], string] =
    document.steps === undefined ? [document.items, 'items'] : [document.steps, 'steps']
  return nodes.flatMap((node, index) =>
    conditionsBelow(node, [index], `document.${name}[${index}]`),
  )
}
