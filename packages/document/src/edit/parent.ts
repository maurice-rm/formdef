import type { DocumentNode, FormDocument } from '../form-document'

/** What holds steps or items: the document, a step, a section or a row; a field holds none. */
export type Parent = FormDocument | DocumentNode
