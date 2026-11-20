/** The option of these options with this value, or `undefined` when there is none. */
export function optionOf<TOption extends { value: string }>(
  options: readonly TOption[],
  value: unknown,
): TOption | undefined {
  return options.find((option) => option.value === value)
}
