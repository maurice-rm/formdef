import type { ValueType } from './value-type'

/** The value types that choose among the options a field's `options` setting lists. */
export type ChoiceValueType = Extract<ValueType, 'choice' | 'choices'>

/** Whether a value type chooses among the options a field's `options` setting lists. */
export function isChoice(valueType: ValueType): valueType is ChoiceValueType {
  return valueType === 'choice' || valueType === 'choices'
}
