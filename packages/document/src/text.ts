/**
 * A text of a form document: a string, which holds for every language, or its translations by
 * language code, one for each language the document names in `languages`.
 *
 * @example
 * ```ts
 * const label: Text = { de: 'Haustyp', en: 'House type' }
 * const unit: Text = 'm²'
 * ```
 */
export type Text = string | { [language: string]: string }
