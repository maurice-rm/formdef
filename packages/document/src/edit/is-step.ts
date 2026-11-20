import type { DocumentNode, DocumentStep } from '../form-document'

/** Whether a node is a step, the one node without a `type`. */
export function isStep(node: DocumentNode): node is DocumentStep {
  return !('type' in node)
}
