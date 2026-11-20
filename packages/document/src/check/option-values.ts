import type { FieldItem } from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { SettingOption } from '../kinds/setting'

const OPTIONS_SETTING = 'options'

/** Whether a value is one option of a choice: a value and a label, both text. */
export const isOption = (value: unknown): value is SettingOption =>
  isPlainObject(value) &&
  typeof value.value === 'string' &&
  value.value !== '' &&
  typeof value.label === 'string' &&
  value.label !== ''

const optionsOf = (field: FieldItem): SettingOption[] => {
  const options = field.settings?.[OPTIONS_SETTING]
  return Array.isArray(options) ? options.filter(isOption) : []
}

/** The option of a choice field with this value, or `undefined` when it has none. */
export const optionOf = (field: FieldItem, value: unknown): SettingOption | undefined =>
  optionsOf(field).find((option) => option.value === value)

/** The option values of a choice field, as its `options` setting lists them. */
export const optionValuesOf = (field: FieldItem): ReadonlySet<string> =>
  new Set(optionsOf(field).map((option) => option.value))
