import type { FieldItem } from '../form-document'
import { optionsOf } from './options-of'
import type { SettingOption } from './setting'

/** The option of a choice field with this value, or `undefined` when it has none. */
export function optionOf(field: FieldItem, value: unknown): SettingOption | undefined {
  return optionsOf(field).find((option) => option.value === value)
}
