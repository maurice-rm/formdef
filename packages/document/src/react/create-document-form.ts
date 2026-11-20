import type { FormProps, Validation } from '@formdef/core'
import { createElement, type ReactNode, useState } from 'react'

import type { FormDocument } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { languageOf } from '../language-of'
import {
  createValidator,
  type DocumentValidator,
  type ValidatorOptions,
} from '../validate/create-validator'
import { type DocumentConfig, documentConfig } from './document-config'
import { endingLayoutOf } from './ending-layout-of'
import { type BlockRenderer, EndingView } from './ending-view'

/**
 * A form component rendered from a form document. It takes the props of every formdef form
 * component, such as `options.onSubmit`; its values are the document's answers.
 */
export type DocumentForm = (props: FormProps<DocumentValidator>) => ReactNode

/**
 * What {@link createDocumentForm} takes besides the document: what {@link createValidator} takes,
 * and more.
 */
export type DocumentFormOptions = ValidatorOptions & {
  /**
   * When the answers are validated, as a form config's `validation`.
   *
   * @defaultValue `{ mode: 'revalidate' }`
   */
  validation?: Validation
  /**
   * Whether the form gives way to the ending that applies once it is submitted, as
   * {@link endingOf} tells it. A project that shows a page of its own or redirects sets it to
   * `false` and calls {@link endingOf} itself.
   *
   * @defaultValue `true`
   */
  showsEnding?: boolean
}

type SubmitArgs = Parameters<
  NonNullable<NonNullable<FormProps<DocumentValidator>['options']>['onSubmit']>
>[0]

type EndingSource = {
  registry: BlockRenderer
  layoutOf: (values: unknown) => unknown[] | undefined
}

// The form gives way to its ending once `onSubmit` is done; one that fails keeps the form.
const withEnding = (Form: DocumentForm, { registry, layoutOf }: EndingSource): DocumentForm =>
  function DocumentFormWithEnding(props) {
    const [layout, setLayout] = useState<unknown[] | undefined>(undefined)
    if (layout !== undefined) {
      return createElement(EndingView, { registry, layout })
    }
    const onSubmit = async (submit: SubmitArgs): Promise<void> => {
      await props.options?.onSubmit?.(submit)
      setLayout(layoutOf(submit.value))
    }
    return createElement(Form, { ...props, options: { ...props.options, onSubmit } })
  }

type CreatesForms = {
  createForm: (config: DocumentConfig & { validation?: Validation }) => DocumentForm
}

/**
 * Turns a form document into a form component of the catalog's registry, through its
 * `createForm`: a document with steps renders through the registered stepper, one without as a
 * plain form. Each field renders with its field kind's widget, label, description and the props
 * its settings give; conditions, required fields and settings that follow an answer update as the
 * answers change. The form validates with {@link createValidator}, so fields that do not show are
 * not validated, and starts with each field's empty value. `onSubmit` receives the form's values,
 * which still hold what was entered in fields that no longer show; the validator's `value` holds
 * the answers of the fields that show, which is what a server keeps. Once `onSubmit` is done, the
 * form gives way to the document's ending that applies, which takes the focus; without one that
 * applies, the form stays.
 *
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses and the registry that renders them.
 * @param options - The error texts, the language and when the answers are validated.
 * @param options.messages - The error texts, by issue code; a code left out keeps its English
 *   text, and a code without any text gets a general one.
 * @param options.language - The language the form shows its texts in; a language the document
 *   does not name gives its first.
 * @param options.validation - When the answers are validated, as a form config's `validation`.
 * @param options.showsEnding - Whether the form gives way to the ending that applies once it is
 *   submitted and `onSubmit` is done.
 * @defaultValue `options.messages`: the English texts; `options.language`: the document's first;
 *   `options.validation`: `{ mode: 'revalidate' }`; `options.showsEnding`: `true`.
 * @returns The form component.
 * @throws When the document has problems, as {@link checkDocument} reports them.
 *
 * @example
 * ```tsx
 * const ChecklistForm = createDocumentForm(document, catalog, { messages: germanMessages })
 *
 * export const Checklist = () => <ChecklistForm options={{ onSubmit: ({ value }) => send(value) }} />
 * ```
 */
export function createDocumentForm(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  options: DocumentFormOptions = {},
): DocumentForm {
  const schema = createValidator(document, catalog, options)
  const language = languageOf(document, options.language)
  const config = documentConfig(document, catalog, { schema, language })
  // The registry's `createForm` types a config written in code; a document's is known at runtime.
  const registry = catalog.registry as CreatesForms & BlockRenderer
  const Form = registry.createForm(
    options.validation === undefined ? config : { ...config, validation: options.validation },
  )
  if (options.showsEnding === false || document.endings === undefined) {
    return Form
  }
  return withEnding(Form, {
    registry,
    layoutOf: (values) => endingLayoutOf(document, catalog, { values, language }),
  })
}
