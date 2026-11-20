import core = require('@formdef/core')
import document = require('@formdef/document')
import documentReact = require('@formdef/document/react')
import tanstack = require('@tanstack/react-form')

const { fieldContext, formContext } = tanstack.createFormHookContexts()

const TextWidget = (_: core.FieldOf<string> & { label?: string }): null => null

const registry = core.createRegistry({ fieldContext, formContext, widgets: { text: TextWidget } })

export const fieldKinds = document.createFieldKinds(registry, [
  document.defineFieldKind(registry, {
    name: 'text',
    label: 'Short text',
    widget: 'text',
    valueType: 'text',
  }),
])

export const form: document.FormDocument = document.readDocument({
  format: 1,
  items: [{ type: 'field', key: 'name', kind: 'text', label: 'Name' }],
})

export const problems: document.Problem[] = document.checkDocument(form, fieldKinds)

export const Form: documentReact.DocumentForm = documentReact.createDocumentForm(form, fieldKinds)
