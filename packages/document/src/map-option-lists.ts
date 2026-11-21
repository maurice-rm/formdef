import type { Varying } from './form-document'
import { isVarying } from './is-varying'
import type { JsonValue } from './json-value'
import { pathTo } from './path-to'

type MapList = (list: readonly JsonValue[], path: string) => JsonValue[]

const mapAt = (value: JsonValue, { path, map }: { path: string; map: MapList }): JsonValue =>
  Array.isArray(value) ? map(value, path) : value

/**
 * A setting's value with each list of options mapped, the value itself or each of its cases and
 * its fallback, given where each list sits; anything else stays as it is.
 */
export function mapOptionLists(
  value: JsonValue | Varying,
  path: string,
  map: MapList,
): JsonValue | Varying {
  if (!isVarying(value)) {
    return mapAt(value, { path, map })
  }
  return {
    cases: value.cases.map((entry, index) => ({
      ...entry,
      value: mapAt(entry.value, { path: pathTo.caseValue(path, index), map }),
    })),
    otherwise: mapAt(value.otherwise, { path: pathTo.otherwise(path), map }),
  }
}
