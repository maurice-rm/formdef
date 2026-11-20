import type { ValueType } from './field-kind'

/** The value types that choose among the options a field's `options` setting lists. */
export type ChoiceValueType = Extract<ValueType, 'choice' | 'choices'>

/** Whether a value type chooses among the options a field's `options` setting lists. */
export const isChoice = (valueType: ValueType): valueType is ChoiceValueType =>
  valueType === 'choice' || valueType === 'choices'
