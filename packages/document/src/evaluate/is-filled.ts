import type { ValueType } from '../kinds/value-type'
import { isMissing } from './is-missing'

/**
 * Whether a field holds an answer: neither missing nor blank text, nor no choice. A boolean is
 * filled when it is true, so a required boolean, such as a consent, has to be checked.
 */
export function isFilled(value: unknown, valueType: ValueType): boolean {
  if (isMissing(value)) {
    return false
  }
  if (valueType === 'boolean') {
    return value === true
  }
  if (typeof value === 'string') {
    return value.trim() !== ''
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return !Number.isNaN(value)
}
