import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { FormDocument } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { checkDocument } from './check-document'

/**
 * Checks that a document has no problems before it is used.
 *
 * @throws When {@link checkDocument} reports any problem, naming how many.
 */
export function refuseProblems(document: FormDocument, catalog: Catalog<unknown, ValueType>): void {
  const { length } = checkDocument(document, catalog)
  if (length === 1) {
    failAt(DOCUMENT_PATH, 'the document has 1 problem; checkDocument lists it.')
  }
  if (length > 1) {
    failAt(DOCUMENT_PATH, `the document has ${length} problems; checkDocument lists them.`)
  }
}
