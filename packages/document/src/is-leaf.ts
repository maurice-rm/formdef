import type { BlockItem, DocumentNode, FieldItem } from './form-document'
import { isStep } from './is-step'

/** Whether a node holds no items: a field or a block. */
export function isLeaf(node: DocumentNode): node is FieldItem | BlockItem {
  return !isStep(node) && (node.type === 'field' || node.type === 'block')
}
