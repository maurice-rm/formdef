import type { FormDocument } from '../form-document'
import type { Parent } from './parent'

/** Whether a parent is the document itself, rather than one of its steps or items. */
export function isDocument(parent: Parent): parent is FormDocument {
  return 'format' in parent
}
