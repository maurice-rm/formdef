import { isPlainObject } from '../is-plain-object'
import { isText } from '../is-text'
import type { Text } from '../text'

/** One choice of an options setting as a document holds it, its texts possibly translated. */
export type DocumentOption = {
  value: string
  label: Text
  description?: Text
}

// A label shows in every language, so none of its translations may be empty.
const isLabel = (value: unknown): boolean =>
  isText(value) &&
  (typeof value === 'string' ? [value] : Object.values(value)).every((entry) => entry !== '')

/** Whether a value is one option of a choice: a value, a label and possibly a description. */
export function isOption(value: unknown): value is DocumentOption {
  return (
    isPlainObject(value) &&
    typeof value.value === 'string' &&
    value.value !== '' &&
    isLabel(value.label) &&
    (value.description === undefined || isText(value.description))
  )
}
