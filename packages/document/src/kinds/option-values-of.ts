import type { FieldItem } from '../form-document'
import { optionsOf } from './options-of'

/** The option values of a choice field, or a block, as its `options` setting lists them. */
export function optionValuesOf(owner: Pick<FieldItem, 'settings'>): ReadonlySet<string> {
  return new Set(optionsOf(owner.settings).map((option) => option.value))
}
