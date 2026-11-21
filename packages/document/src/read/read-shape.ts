import { failAt } from '../fail-at'
import { isPlainObject } from '../is-plain-object'

/** An object of a document as read, before its keys are checked. */
export type Shape = Record<string, unknown>

export function readShape(value: unknown, path: string): Shape {
  return isPlainObject(value) ? value : failAt(path, 'expected an object.')
}
