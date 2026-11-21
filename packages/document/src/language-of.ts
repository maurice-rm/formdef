import type { FormDocument } from './form-document'

/**
 * The language a document is used in: the one asked for when the document names it, otherwise
 * its first; `undefined` for a document without languages, whose texts are strings.
 */
export function languageOf(document: FormDocument, asked: string | undefined): string | undefined {
  const { languages } = document
  if (languages === undefined) {
    return undefined
  }
  return asked !== undefined && languages.includes(asked) ? asked : languages[0]
}
