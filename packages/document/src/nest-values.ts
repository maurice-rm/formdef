import type { DocumentValues } from './document-values'

/** Where a value sits: step, field and repeat keys, and the index of a repeat's entry. */
export type ValuePath = readonly (string | number)[]

/** A value with where it sits. */
type PlacedValue = { path: ValuePath; value: unknown }

type Container = Record<string | number, unknown>

const containerFor = (segment: string | number): Container =>
  (typeof segment === 'number' ? [] : {}) as Container

const placeAt = (target: Container, { path, value }: PlacedValue): void => {
  const [segment, ...rest] = path
  if (segment === undefined) {
    return
  }
  const [next] = rest
  if (next === undefined) {
    target[segment] = value
    return
  }
  const inner = (target[segment] ?? containerFor(next)) as Container
  target[segment] = inner
  placeAt(inner, { path: rest, value })
}

/**
 * The values of a document from values placed by path, nested by step key where a path has one,
 * and into a repeat's entries by their index. A value placed on a path another value runs through
 * is the container the later ones go into.
 */
export function nestValues(placed: readonly PlacedValue[]): DocumentValues {
  const values: Container = {}
  for (const entry of placed) {
    placeAt(values, entry)
  }
  return values
}
