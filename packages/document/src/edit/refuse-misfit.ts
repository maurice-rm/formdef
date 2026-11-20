import type { DocumentNode } from '../form-document'
import { failAtPosition } from './fail-at-position'
import { isDocument } from './is-document'
import { isField } from './is-field'
import { isStep } from './is-step'
import type { Parent } from './parent'
import type { Position } from './position'

/**
 * Checks that a parent may hold a node: a document with steps holds steps, a row holds fields,
 * and the rest hold fields, rows and sections.
 *
 * @throws When it may not.
 */
export function refuseMisfit(parent: Parent, node: DocumentNode, position: Position): void {
  const holdsSteps = isDocument(parent) && parent.steps !== undefined
  if (holdsSteps && !isStep(node)) {
    failAtPosition(position, 'a form with steps holds steps only.')
  }
  if (!holdsSteps && isStep(node)) {
    failAtPosition(position, 'a step goes only into the steps of a form.')
  }
  const isRow = !isDocument(parent) && !isStep(parent) && parent.type === 'row'
  if (isRow && !isField(node)) {
    failAtPosition(position, 'a row holds fields only.')
  }
}
