import { readList } from './read-list'

/** Reads a list, each entry as given, at its index's path. */
export function readEach<TEntry>(
  value: unknown,
  path: string,
  read: (entry: unknown, path: string) => TEntry,
): TEntry[] {
  return readList(value, path).map((entry, index) => read(entry, `${path}[${index}]`))
}
