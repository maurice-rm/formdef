import type { DocumentNode, FieldItem } from '../form-document'
import { isStep } from './is-step'

/** Whether a node is a field, the one node that holds no items. */
export const isField = (node: DocumentNode): node is FieldItem =>
  !isStep(node) && node.type === 'field'
