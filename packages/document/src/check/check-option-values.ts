import type { JsonValue } from '../json-value'
import type { CheckWalk } from './check-walk'
import { report } from './report'

type Chosen = {
  /** The key of the field whose options the value names. */
  field: string
  /** The values of the field's options. */
  options: ReadonlySet<string>
}

const checkOptionValue = (
  value: JsonValue,
  { field, options }: Chosen,
  { walk, path }: { walk: CheckWalk; path: string },
): void => {
  if (typeof value === 'string' && options.has(value)) {
    return
  }
  report(walk, { code: 'unknownOption', path, params: { field, value: String(value) } })
}

/**
 * Checks that a value names options of a field: one option's value, or each entry of a list of
 * them.
 */
export function checkOptionValues(
  value: JsonValue,
  chosen: Chosen,
  { walk, path }: { walk: CheckWalk; path: string },
): void {
  if (!Array.isArray(value)) {
    checkOptionValue(value, chosen, { walk, path })
    return
  }
  value.forEach((entry, index) => {
    checkOptionValue(entry, chosen, { walk, path: `${path}[${index}]` })
  })
}
