import { isPlainObject } from '../is-plain-object'
import { isText } from '../is-text'
import { looksVarying } from '../looks-varying'
import type { DocumentOption } from './document-option'

// A label shows in every language, so none of its translations may be empty.
const isLabel = (value: unknown): boolean =>
  isText(value) &&
  (typeof value === 'string' ? [value] : Object.values(value)).every((entry) => entry !== '')

// `readDocument` has read the conditions of a text that follows an answer; its texts remain.
const isVaryingOf = (value: unknown, isPlain: (text: unknown) => boolean): boolean => {
  if (!looksVarying(value)) {
    return isPlain(value)
  }
  const cases = Array.isArray(value.cases) ? value.cases : []
  return (
    cases.every((entry) => isPlainObject(entry) && isPlain(entry.value)) && isPlain(value.otherwise)
  )
}

const isScore = (value: unknown): boolean =>
  value === undefined || (typeof value === 'number' && Number.isFinite(value))

/**
 * Whether a value is one option of a choice: a value, a label and possibly a description and a
 * score.
 */
export function isOption(value: unknown): value is DocumentOption {
  return (
    isPlainObject(value) &&
    typeof value.value === 'string' &&
    value.value !== '' &&
    isVaryingOf(value.label, isLabel) &&
    (value.description === undefined || isVaryingOf(value.description, isText)) &&
    isScore(value.score)
  )
}
