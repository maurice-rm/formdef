import { isPlainObject } from './is-plain-object'
import { textEntriesOf } from './text-entries-of'

/** A string of a document, with where it sits. */
export type PlacedString = { text: string; path: string }

/**
 * Every string inside a value of a document that may be a text, such as a text, its translations
 * and cases, or a setting, with where it sits; conditions and the values of options are left out.
 */
export function stringsIn(value: unknown, path: string): PlacedString[] {
  if (typeof value === 'string') {
    return [{ text: value, path }]
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => stringsIn(entry, `${path}[${index}]`))
  }
  if (!isPlainObject(value)) {
    return []
  }
  return textEntriesOf(value).flatMap(([key, entry]) => stringsIn(entry, `${path}.${key}`))
}
