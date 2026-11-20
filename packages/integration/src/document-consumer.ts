import { createRegistry, type FieldOf } from '@formdef/core'
import {
  checkDocument,
  createCatalog,
  createValidator,
  defineFieldKind,
  describeAnswers,
  type FormDocument,
  insertNode,
  type Problem,
  readDocument,
  rule,
  setting,
} from '@formdef/document'
import { createDocumentForm, type DocumentForm } from '@formdef/document/react'
import { createFormHookContexts } from '@tanstack/react-form'

const { fieldContext, formContext } = createFormHookContexts()

const TextWidget = (
  _: FieldOf<string> & { label?: string; placeholder?: string | undefined },
): null => null

const registry = createRegistry({ fieldContext, formContext, widgets: { text: TextWidget } })

const text = defineFieldKind(registry, {
  name: 'text',
  label: 'Short text',
  widget: 'text',
  valueType: 'text',
  settings: { placeholder: setting.text({ label: 'Placeholder' }) },
  props: ({ placeholder }) => ({ placeholder }),
  rules: () => [rule.maxLength(80)],
})

defineFieldKind(registry, {
  name: 'count',
  label: 'Count',
  widget: 'text',
  // @ts-expect-error a text widget gives no number
  valueType: 'number',
})

export const catalog = createCatalog(registry, { fields: [text] })

export const document: FormDocument = readDocument({
  format: 1,
  items: [{ type: 'field', key: 'name', kind: 'text', label: 'Name', required: true }],
})

export const problems: Problem[] = checkDocument(document, catalog)

export const isValid: boolean =
  createValidator(document, catalog)['~standard'].validate({ name: 'Ada' }).issues === undefined

export const summary: unknown = describeAnswers(document, catalog, { name: 'Ada' })

export const longer: FormDocument = insertNode(document, [1], {
  type: 'field',
  key: 'email',
  kind: 'text',
  label: 'Email',
})

// @ts-expect-error a document holds either steps or items
export const both: FormDocument = { format: 1, steps: [], items: [] }

export const Form: DocumentForm = createDocumentForm(document, catalog, {
  validation: { mode: 'blurThenChange' },
})
