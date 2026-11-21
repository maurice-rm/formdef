import { isPlainObject } from './is-plain-object'
import { textEntriesOf } from './text-entries-of'

/**
 * A value of a document with every string mapped that {@link stringsIn} finds; conditions and the
 * values of options stay as they are.
 */
export function mapStrings<TValue>(value: TValue, map: (text: string) => string): TValue {
  if (typeof value === 'string') {
    return map(value) as TValue
  }
  if (Array.isArray(value)) {
    return value.map((entry) => mapStrings(entry, map)) as TValue
  }
  if (!isPlainObject(value)) {
    return value
  }
  const mapped = Object.fromEntries(
    textEntriesOf(value).map(([key, entry]) => [key, mapStrings(entry, map)]),
  )
  return { ...value, ...mapped } as TValue
}
