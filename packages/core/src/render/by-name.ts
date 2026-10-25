/** What `map` holds under `name` itself; a name every object inherits finds nothing. */
export function byName<TValue>(
  map: Readonly<Record<string, TValue>>,
  name: string,
): TValue | undefined {
  return Object.hasOwn(map, name) ? map[name] : undefined
}
