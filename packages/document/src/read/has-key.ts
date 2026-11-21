import type { Shape } from './read-shape'

export function hasKey(shape: Shape, key: string): boolean {
  return Object.hasOwn(shape, key)
}
