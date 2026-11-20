import type { FieldItem } from '../form-document'
import { optionsOf } from './options-of'

/** The option values of a choice field, as its `options` setting lists them. */
export function optionValuesOf(field: FieldItem): ReadonlySet<string> {
  return new Set(optionsOf(field.settings).map((option) => option.value))
}
