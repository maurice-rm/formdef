import type { FieldItem } from '../form-document'
import { isOption } from './is-option'
import type { SettingOption } from './setting'

const OPTIONS_SETTING = 'options'

/** The options of a choice field, as its `options` setting lists them; empty without. */
export function optionsOf(field: FieldItem): SettingOption[] {
  const options = field.settings?.[OPTIONS_SETTING]
  return Array.isArray(options) ? options.filter(isOption) : []
}
