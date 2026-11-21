import type { Varying } from './form-document'
import { isVarying } from './is-varying'
import type { JsonValue } from './json-value'
import { pathTo } from './path-to'

/** A list a setting holds, such as its options, with where it sits. */
export type PlacedList = { list: readonly JsonValue[]; path: string }

const listAt = (value: JsonValue, path: string): PlacedList[] =>
  Array.isArray(value) ? [{ list: value, path }] : []

/**
 * The lists a setting holds, where the texts of options sit: its value, or the value of each case
 * and the fallback of a setting that follows an answer.
 */
export function optionListsOf(value: JsonValue | Varying, path: string): PlacedList[] {
  if (!isVarying(value)) {
    return listAt(value, path)
  }
  return [
    ...value.cases.flatMap((entry, index) => listAt(entry.value, pathTo.caseValue(path, index))),
    ...listAt(value.otherwise, pathTo.otherwise(path)),
  ]
}
