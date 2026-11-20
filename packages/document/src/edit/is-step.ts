import type { DocumentNode, DocumentStep } from '../form-document'

/** Whether a node is a step, the one node without a `type`. */
export const isStep = (node: DocumentNode): node is DocumentStep => !('type' in node)
