import { isPlainObject } from '../is-plain-object'
import type { SettingOption } from './setting'

/** Whether a value is one option of a choice: a value and a label, both text. */
export function isOption(value: unknown): value is SettingOption {
  return (
    isPlainObject(value) &&
    typeof value.value === 'string' &&
    value.value !== '' &&
    typeof value.label === 'string' &&
    value.label !== ''
  )
}
