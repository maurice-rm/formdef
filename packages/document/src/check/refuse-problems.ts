import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { FormDocument } from '../form-document'
import type { FieldKinds } from '../kinds/create-field-kinds'
import { checkDocument } from './check-document'

/**
 * Checks that a document has no problems before it is used.
 *
 * @throws Error naming how many problems `checkDocument` reports, when it reports any.
 */
export const refuseProblems = (document: FormDocument, kinds: FieldKinds<unknown>): void => {
  const { length } = checkDocument(document, kinds)
  if (length === 1) {
    failAt(DOCUMENT_PATH, 'the document has 1 problem; checkDocument lists it.')
  }
  if (length > 1) {
    failAt(DOCUMENT_PATH, `the document has ${length} problems; checkDocument lists them.`)
  }
}
