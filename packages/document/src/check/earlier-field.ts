import type { ValueType } from '../kinds/value-type'

/** An answer already passed in document order, which later conditions may compare. */
export type EarlierField = {
  /** The key the answer sits under. */
  key: string
  /** The value type of the answer; `undefined` when its kind is not registered. */
  valueType: ValueType | undefined
  /** The values of the options the answer chooses among. */
  optionValues: ReadonlySet<string>
}

const NO_OPTIONS: ReadonlySet<string> = new Set()

/** An earlier answer that chooses among no options, such as a computed value. */
export function earlierWithoutOptions(key: string, valueType: ValueType | undefined): EarlierField {
  return { key, valueType, optionValues: NO_OPTIONS }
}
