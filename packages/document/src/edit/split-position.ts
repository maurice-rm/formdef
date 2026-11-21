import type { Position } from '../position'
import { failAtPosition } from './fail-at-position'
import type { Target } from './update-children'

/**
 * Splits a position into its parent's position and its index among the parent's children.
 *
 * @throws When the position is the root's.
 */
export function splitPosition(position: Position): Target & { index: number } {
  const index = position.at(-1) ?? failAtPosition(position, 'there is nothing here.')
  return { parent: position.slice(0, -1), position, index }
}
