import type { ValueType } from '../kinds/field-kind'

/** A filled answer of a field that shows, with the value type of its field kind. */
export type Answer = {
  value: unknown
  valueType: ValueType
}

/**
 * The answers conditions compare, by field key: only of fields that show, are filled and hold a
 * value of their value type. A field missing here counts as empty.
 */
export type Answers = ReadonlyMap<string, Answer>
