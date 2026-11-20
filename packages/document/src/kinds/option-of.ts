import type { SettingOption } from './setting'

/** The option of these options with this value, or `undefined` when there is none. */
export function optionOf(
  options: readonly SettingOption[],
  value: unknown,
): SettingOption | undefined {
  return options.find((option) => option.value === value)
}
