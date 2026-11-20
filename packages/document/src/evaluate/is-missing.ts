/** Whether a field holds no value at all, before its type is looked at. */
export function isMissing(value: unknown): value is null | undefined {
  return value === undefined || value === null
}
