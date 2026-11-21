import { failAt } from '../fail-at'
import type { Shape } from './read-shape'

export function readOnlyKeys(shape: Shape, keys: readonly string[], path: string): void {
  const unknown = Object.keys(shape).find((key) => !keys.includes(key))
  if (unknown !== undefined) {
    failAt(`${path}.${unknown}`, 'unknown key.')
  }
}
