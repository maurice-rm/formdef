const PATH_SEGMENT = /[^.[\]]+/g

/** The value at a TanStack field path such as `items[0].name`; `undefined` where the path ends early. */
export function valueAt(values: unknown, path: string): unknown {
  const segments = path.match(PATH_SEGMENT) ?? []

  return segments.reduce<unknown>(
    (current, segment) =>
      typeof current === 'object' && current !== null
        ? (current as Record<string, unknown>)[segment]
        : undefined,
    values,
  )
}
