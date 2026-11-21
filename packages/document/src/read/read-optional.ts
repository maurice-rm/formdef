import type { Shape } from './read-shape'
import { withOptional } from './with-optional'

/**
 * An object with a key of the shape read as given at its path, or an empty one when the shape
 * leaves the key out.
 */
export function readOptional<TKey extends string, TValue>(
  shape: Shape,
  key: TKey,
  { path, read }: { path: string; read: (value: unknown, path: string) => TValue },
): Partial<Record<TKey, TValue>> {
  const value = shape[key]
  return withOptional(key, value === undefined ? undefined : read(value, `${path}.${key}`))
}
