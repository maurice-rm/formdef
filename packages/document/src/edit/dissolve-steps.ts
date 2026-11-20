import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { FormDocument, SectionItem } from '../form-document'

/**
 * Turns a form with steps into one without: each step becomes a section with the step's label,
 * description, condition and items. A section of a step now sits one level deeper, and one nested
 * too deep {@link checkDocument} reports.
 *
 * @param document - The document, with steps.
 * @returns The document without steps, in the same languages.
 * @throws When the document has no steps.
 *
 * @example
 * ```ts
 * const next = dissolveSteps(document)
 * ```
 */
export function dissolveSteps(document: FormDocument): FormDocument {
  const { steps: given, items: _items, ...head } = document
  const steps = given ?? failAt(DOCUMENT_PATH, 'the form has no steps.')
  const items = steps.map(
    ({ label, description, visibleWhen, items: stepItems }): SectionItem => ({
      type: 'section',
      label,
      ...(description === undefined ? {} : { description }),
      ...(visibleWhen === undefined ? {} : { visibleWhen }),
      items: stepItems,
    }),
  )
  return { ...head, items }
}
