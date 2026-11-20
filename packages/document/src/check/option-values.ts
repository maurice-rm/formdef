import type { FieldItem } from '../form-document'
import { isPlainObject } from '../is-plain-object'

const OPTIONS_SETTING = 'options'

/** Whether a value is one option of a choice: a value and a label, both text. */
export const isOption = (value: unknown): value is { value: string; label: string } =>
  isPlainObject(value) &&
  typeof value.value === 'string' &&
  value.value !== '' &&
  typeof value.label === 'string' &&
  value.label !== ''

/** The option values of a choice field, as its `options` setting lists them. */
export const optionValuesOf = (field: FieldItem): ReadonlySet<string> => {
  const options = field.settings?.[OPTIONS_SETTING]
  if (!Array.isArray(options)) return new Set()

  return new Set(options.filter(isOption).map((option) => option.value))
}
