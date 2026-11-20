import type { ValueType } from '../kinds/field-kind'

const EMPTY_VALUES: Record<ValueType, unknown> = {
  text: '',
  choice: '',
  decimal: '',
  date: '',
  choices: [],
  boolean: false,
  number: undefined,
}

/**
 * The value a field of this value type starts with, which `isFilled` reads as no answer: the
 * empty value the shadcn widgets declare for these types.
 */
export const emptyValueOf = (valueType: ValueType): unknown => EMPTY_VALUES[valueType]
