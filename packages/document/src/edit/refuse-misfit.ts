import type { DocumentNode } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import type { Position } from '../position'
import { failAtPosition } from './fail-at-position'
import { isDocument } from './is-document'
import type { Parent } from './parent'

/**
 * Checks that a parent may hold a node: a document with steps holds steps, a row holds fields
 * and blocks, and the rest hold fields, blocks, rows and sections.
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
  if (isRow && !isLeaf(node)) {
    failAtPosition(position, 'a row holds fields and blocks only.')
  }
}
