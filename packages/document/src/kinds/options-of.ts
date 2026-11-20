import { type DocumentOption, isOption } from './is-option'

const OPTIONS_SETTING = 'options'

/** The options of a choice field, as its settings' `options` lists them; empty without. */
export function optionsOf(
  settings: Readonly<Record<string, unknown>> | undefined,
): DocumentOption[] {
  const options = settings?.[OPTIONS_SETTING]
  return Array.isArray(options) ? options.filter(isOption) : []
}
