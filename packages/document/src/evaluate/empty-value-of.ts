import type { ValueType } from '../kinds/value-type'

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
 * The value a field of this value type starts with, which {@link isFilled} reads as no answer:
 * the empty value the shadcn widgets declare for these types.
 */
export function emptyValueOf(valueType: ValueType): unknown {
  return EMPTY_VALUES[valueType]
}
