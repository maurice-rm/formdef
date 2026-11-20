/** The answers of a form document: nested by step key in a document with steps, flat without. */
export type DocumentValues = Record<string, unknown>

/** A value with where it sits: the step key and field key, or the field key alone. */
type PlacedValue = { path: readonly string[]; value: unknown }

/** The values of a document from values placed by path, nested by step key where a path has one. */
export const nestValues = (placed: readonly PlacedValue[]): DocumentValues => {
  const values: DocumentValues = {}
  for (const { path, value } of placed) {
    const [first = '', second] = path
    if (second === undefined) {
      values[first] = value
      continue
    }
    values[first] = { ...(values[first] as DocumentValues | undefined), [second]: value }
  }
  return values
}
