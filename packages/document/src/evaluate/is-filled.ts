import type { ValueType } from '../kinds/value-type'
import { isMissing } from './is-missing'

/**
 * Whether a field holds an answer: a value of its value type that the value type counts as
 * filled, such as text that is not blank or a boolean that is true.
 */
export function isFilled(value: unknown, valueType: ValueType): boolean {
  return !isMissing(value) && valueType.fits(value) && valueType.isFilled(value)
}
