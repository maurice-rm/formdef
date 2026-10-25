const PATH_SEPARATORS = /[.[\]]+/g
const SELECTOR_SAFE_SEPARATOR = '__'

/**
 * Builds the DOM id that `fieldParts` gives the control of a field, for code that has no
 * field at hand — an error summary above the form that links to each invalid field, for example.
 *
 * The id is the form's id, a hyphen, and the field's path with every run of dots and brackets
 * replaced by `__`. Fields of two different forms therefore never share an id, and the id can be
 * used in a CSS selector without escaping.
 *
 * @param formId - The id of the form, as TanStack Form reports it in `form.formId`.
 * @param path - The path of the field, such as `email`, `address.zip` or `contacts[0].name`.
 * @returns The id of the field's control, such as `signup-address__zip`.
 *
 * @remarks
 * The replacement cannot be reversed: a field literally named `a__b` gets the same id as the
 * path `a.b`.
 *
 * @example
 * ```tsx
 * <a href={`#${fieldId(form.formId, 'address.zip')}`}>Postal code</a>
 * ```
 */
export function fieldId(formId: string, path: string): string {
  return `${formId}-${path.replace(PATH_SEPARATORS, SELECTOR_SAFE_SEPARATOR)}`
}
