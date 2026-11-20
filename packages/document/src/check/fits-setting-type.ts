import { isIsoDate } from '../is-iso-date'
import type { JsonValue } from '../json-value'
import { isOption } from '../kinds/is-option'
import type { SettingType } from '../kinds/setting'

const isText = (value: JsonValue): value is string => typeof value === 'string'

const FITS: Record<SettingType, (value: JsonValue) => boolean> = {
  text: isText,
  number: (value) => typeof value === 'number',
  boolean: (value) => typeof value === 'boolean',
  date: isIsoDate,
  options: (value) => Array.isArray(value) && value.every(isOption),
  option: isText,
  optionList: (value) => Array.isArray(value) && value.every(isText),
}

/** Whether a value has the type a setting holds, before its constraints are looked at. */
export function fitsSettingType(value: JsonValue, type: SettingType): boolean {
  return FITS[type](value)
}
