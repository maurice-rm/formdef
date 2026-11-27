import core = require('@formdef/core')
import document = require('@formdef/document')
import documentReact = require('@formdef/document/react')

const TextWidget = (_: core.FieldOf<string> & { label?: string }): null => null

const registry = core.createRegistry({ widgets: { text: TextWidget } })

const text = document.defineFieldKind(registry, {
  name: 'text',
  label: 'Short text',
  widget: 'text',
  valueType: document.valueTypes.text,
})

export const catalog = document.createCatalog(registry, { fields: [text] })

export const form: document.FormDocument = document.readDocument({
  format: 1,
  items: [{ type: 'field', key: 'name', kind: 'text', label: 'Name' }],
})

export const problems: document.Problem[] = document.checkDocument(form, catalog)

export const Form: documentReact.DocumentForm = documentReact.createDocumentForm(form, catalog)
