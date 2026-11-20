import { isPlainObject } from './is-plain-object'
import type { Text } from './text'

/** Whether a value is a text: a string, or translations of at least one language, each a string. */
export function isText(value: unknown): value is Text {
  if (typeof value === 'string') {
    return true
  }
  const translations = isPlainObject(value) ? Object.values(value) : []
  return translations.length > 0 && translations.every((entry) => typeof entry === 'string')
}
