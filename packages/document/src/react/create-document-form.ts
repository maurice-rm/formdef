import type { FormProps, Validation } from '@formdef/core'
import type { ReactNode } from 'react'

import type { FormDocument } from '../form-document'
import type { FieldKinds } from '../kinds/create-field-kinds'
import { createValidator, type DocumentValidator } from '../validate/create-validator'
import type { Messages } from '../validate/messages'
import { type DocumentConfig, documentConfig } from './document-config'

/**
 * A form component rendered from a form document. It takes the props of every formdef form
 * component, such as `options.onSubmit`; its values are the document's answers.
 */
export type DocumentForm = (props: FormProps<DocumentValidator>) => ReactNode

/** What `createDocumentForm` takes besides the document. */
export type DocumentFormOptions = {
  /**
   * The error texts, by issue code, as `createValidator` takes them.
   *
   * @defaultValue English texts
   */
  messages?: Messages
  /**
   * When the answers are validated, as a form config's `validation`.
   *
   * @defaultValue `{ mode: 'revalidate' }`
   */
  validation?: Validation
}

type CreatesForms = {
  createForm: (config: DocumentConfig & { validation?: Validation }) => DocumentForm
}

/**
 * Turns a form document into a form component of the field kinds' registry, through its
 * `createForm`: a document with steps renders through the registered stepper, one without as a
 * plain form. Each field renders with its field kind's widget, label, hint and the props its
 * settings give; conditions, required fields and settings that follow an answer update as the
 * answers change. The form validates with `createValidator`, so fields that do not show are not
 * validated, and starts with each field's empty value. `onSubmit` receives the form's values,
 * which still hold what was entered in fields that no longer show; the validator's `value` holds
 * the answers of the fields that show, which is what a server keeps.
 *
 * @param document - The document, as `readDocument` returns it.
 * @param kinds - The field kinds the document's fields are of, with the registry that renders them.
 * @param options - The error texts and when the answers are validated.
 * @returns The form component.
 * @throws Error when the document has problems, as `checkDocument` reports them.
 *
 * @example
 * ```tsx
 * const ChecklistForm = createDocumentForm(document, fieldKinds, { messages: germanMessages })
 *
 * export const Checklist = () => <ChecklistForm options={{ onSubmit: ({ value }) => send(value) }} />
 * ```
 */
export const createDocumentForm = (
  document: FormDocument,
  kinds: FieldKinds<unknown>,
  options: DocumentFormOptions = {},
): DocumentForm => {
  const schema = createValidator(document, kinds, options)
  const config = documentConfig(document, kinds, schema)
  // The registry's `createForm` types a config written in code; a document's is known at runtime.
  const { createForm } = kinds.registry as CreatesForms

  return createForm(
    options.validation === undefined ? config : { ...config, validation: options.validation },
  )
}
