import type { Display } from '../form-document'
import { readOnlyKeys } from './read-only-keys'
import { readOptional } from './read-optional'
import { readSettings } from './read-settings'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'

const DISPLAY_KEYS = ['kind', 'settings']

const readDisplayAt = (value: unknown, path: string): Display => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, DISPLAY_KEYS, path)

  return {
    kind: readText(shape.kind, `${path}.kind`),
    ...readOptional(shape, 'settings', { path, read: readSettings }),
  }
}

/** Reads the `display` of the form, a step, a section, a row or a repeat, when it has one. */
export function readDisplay(shape: Shape, path: string): Partial<Record<'display', Display>> {
  return readOptional(shape, 'display', { path, read: readDisplayAt })
}
