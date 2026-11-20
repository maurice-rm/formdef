import { failAt } from '../fail-at'
import type { Position } from './position'

/**
 * Throws the error of an edit operation at a position, such as `formdef: position [1, 0]: …`.
 *
 * @throws Always.
 */
export function failAtPosition(position: Position, problem: string): never {
  return failAt(`position [${position.join(', ')}]`, problem)
}
