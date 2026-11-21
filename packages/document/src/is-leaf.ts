import type { BlockItem, ComputedItem, DocumentNode, FieldItem } from './form-document'
import { isStep } from './is-step'

/** Whether a node holds no items: a field, a block or a computed value. */
export function isLeaf(node: DocumentNode): node is FieldItem | BlockItem | ComputedItem {
  return (
    !isStep(node) && (node.type === 'field' || node.type === 'block' || node.type === 'computed')
  )
}
