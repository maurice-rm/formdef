import type { Varying } from './form-document'
import { isVarying } from './is-varying'
import type { JsonValue } from './json-value'

type MapList = (list: readonly JsonValue[]) => JsonValue[]

const mapAt = (value: JsonValue, map: MapList): JsonValue =>
  Array.isArray(value) ? map(value) : value

/**
 * A setting with each list it holds mapped, the same lists {@link optionListsOf} finds: its value,
 * or the value of each case and the fallback of a setting that follows an answer.
 */
export function mapOptionLists(value: JsonValue | Varying, map: MapList): JsonValue | Varying {
  if (!isVarying(value)) {
    return mapAt(value, map)
  }
  return {
    cases: value.cases.map((entry) => ({ ...entry, value: mapAt(entry.value, map) })),
    otherwise: mapAt(value.otherwise, map),
  }
}
