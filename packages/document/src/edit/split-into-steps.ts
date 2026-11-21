import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { DocumentStep, FormDocument } from '../form-document'

/**
 * Turns a form without steps into one with steps: its items become the items of one step. The
 * label of its submit button is left out, as the stepper submits a form of steps.
 *
 * @param document - The document, without steps.
 * @param step - The key and label of the step, and what else it takes, such as a description.
 * @returns The document with one step, in the same languages.
 * @throws When the document has steps already.
 *
 * @example
 * ```ts
 * const next = splitIntoSteps(document, { key: createKey('s'), label: 'Contact' })
 * ```
 */
export function splitIntoSteps(
  document: FormDocument,
  step: Omit<DocumentStep, 'items'>,
): FormDocument {
  if (document.steps !== undefined) {
    failAt(DOCUMENT_PATH, 'the form has steps already.')
  }
  const { items, steps: _steps, submit: _appliesToPlainForms, ...head } = document
  return { ...head, steps: [{ ...step, items }] }
}
