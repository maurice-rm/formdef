import type { ValueType } from '../kinds/value-type'

/** A filled answer of a field that shows, with the value type of its field kind. */
export type Answer = {
  value: unknown
  valueType: ValueType
}

/**
 * The answers conditions compare: by field key, the answer of a field that shows, is filled and
 * holds a value of its value type, and the value type of every field of the document, which
 * decides how a condition compares it. A field without an answer counts as empty.
 */
export type Answers = {
  get: (key: string) => Answer | undefined
  valueTypeOf: (key: string) => ValueType | undefined
}
