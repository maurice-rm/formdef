import type { FormDocument, SectionItem } from '../form-document'

/**
 * Turns a form with steps into one without: each step becomes a section with the step's label,
 * its condition and its items. A step's description has no place in a section and is dropped; a
 * section of a step now sits one level deeper, and one nested too deep `checkDocument` reports.
 *
 * @param document - The document, with steps.
 * @returns The document without steps.
 * @throws Error when the document has no steps.
 *
 * @example
 * ```ts
 * const next = dissolveSteps(document)
 * ```
 */
export const dissolveSteps = (document: FormDocument): FormDocument => {
  if (document.steps === undefined) {
    throw new Error('formdef: document: the form has no steps.')
  }
  const items = document.steps.map(
    ({ label, visibleWhen, items: stepItems }): SectionItem => ({
      type: 'section',
      label,
      ...(visibleWhen === undefined ? {} : { visibleWhen }),
      items: stepItems,
    }),
  )
  return { format: document.format, items }
}
