import { dayOf, isIsoDate } from '../iso-date'
import type { ValueType } from '../kinds/field-kind'

// An ISO time after the day: hours and minutes, optional seconds and fraction, optional offset.
const ISO_TIME = /^T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/

const isText = (value: unknown): value is string => typeof value === 'string'

const isDate = (value: unknown): boolean => {
  if (!isText(value)) return false
  const time = value.slice(dayOf(value).length)
  return isIsoDate(dayOf(value)) && (time === '' || ISO_TIME.test(time))
}

const FITS: Record<ValueType, (value: unknown) => boolean> = {
  text: isText,
  choice: isText,
  decimal: isText,
  date: isDate,
  choices: (value) => Array.isArray(value) && value.every(isText),
  boolean: (value) => typeof value === 'boolean',
  number: (value) => typeof value === 'number' && Number.isFinite(value),
}

/** Whether a value has the type of answer a value type stands for, such as text for a decimal. */
export const fitsValueType = (value: unknown, valueType: ValueType): boolean =>
  FITS[valueType](value)

/**
 * Whether a field holds an answer: neither missing nor blank text, nor no choice. A boolean is
 * filled when it is true, so a required boolean, such as a consent, has to be checked.
 */
export const isFilled = (value: unknown, valueType: ValueType): boolean => {
  if (value === undefined || value === null) return false
  if (valueType === 'boolean') return value === true
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return !Number.isNaN(value)
}
