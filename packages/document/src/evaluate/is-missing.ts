/** Whether a field holds no value at all, before its type is looked at. */
export const isMissing = (value: unknown): value is null | undefined =>
  value === undefined || value === null
