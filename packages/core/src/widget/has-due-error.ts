/** The meta of a field, as far as whether its error is due reads it. */
type DueMeta = {
  isValid: boolean
  isBlurred: boolean
  isDirty: boolean
}

/**
 * Whether a field's error is due: the field is invalid, and it was edited and left, or its form was
 * submitted (`wasSubmitted`).
 */
export function hasDueError(meta: DueMeta, wasSubmitted: boolean): boolean {
  const wasEditedAndLeft = meta.isBlurred && meta.isDirty

  return !meta.isValid && (wasEditedAndLeft || wasSubmitted)
}
