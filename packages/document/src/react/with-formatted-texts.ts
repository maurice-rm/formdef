import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import { isFormattedText } from '../kinds/is-formatted-text'
import type { Setting } from '../kinds/setting'
import { formatText } from './format-text'

const formatOption = (option: unknown): unknown =>
  isPlainObject(option) && typeof option.description === 'string'
    ? { ...option, description: formatText(option.description) }
    : option

const formatSetting = (value: JsonValue, setting: Setting<unknown> | undefined): unknown => {
  if (isFormattedText(setting) && typeof value === 'string') {
    return formatText(value)
  }
  if (setting?.type === 'options' && Array.isArray(value)) {
    return value.map(formatOption)
  }
  return value
}

/**
 * The settings of a field or block, resolved to strings, with its formatted texts and the
 * descriptions of its options rendered formatted, as a kind's `props` receive them.
 */
export function withFormattedTexts(
  settings: Readonly<Record<string, JsonValue>>,
  kind: { readonly settings: Readonly<Record<string, Setting<unknown>>> },
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(settings).map(([name, value]) => [
      name,
      formatSetting(value, kind.settings[name]),
    ]),
  )
}
