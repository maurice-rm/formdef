import type { DocumentNode, FieldItem } from './form-document'
import { isStep } from './is-step'

/** Whether a node is a field, the one node that holds no items. */
export function isField(node: DocumentNode): node is FieldItem {
  return !isStep(node) && node.type === 'field'
}
