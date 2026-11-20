/** An object with the key set to the value, or an empty one when the value is `undefined`. */
export function withOptional<TKey extends string, TValue>(
  key: TKey,
  value: TValue | undefined,
): Partial<Record<TKey, TValue>> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, TValue>)
}
