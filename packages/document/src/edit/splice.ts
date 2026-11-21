/** The list with `inserted` in place of the `removed` entries from `index` on, as a copy. */
export function splice<TEntry>(
  list: readonly TEntry[],
  { index, removed }: { index: number; removed: number },
  ...inserted: TEntry[]
): TEntry[] {
  return [...list.slice(0, index), ...inserted, ...list.slice(index + removed)]
}
