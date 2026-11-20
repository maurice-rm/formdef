import type { Display } from '../form-document'
import { readOnlyKeys } from './read-only-keys'
import { readSettings } from './read-settings'
import { readShape, type Shape } from './read-shape'
import { readText } from './read-text'
import { withOptional } from './with-optional'

const DISPLAY_KEYS = ['kind', 'settings']

const readDisplayAt = (value: unknown, path: string): Display => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, DISPLAY_KEYS, path)

  return {
    kind: readText(shape.kind, `${path}.kind`),
    ...withOptional(
      'settings',
      shape.settings === undefined ? undefined : readSettings(shape.settings, `${path}.settings`),
    ),
  }
}

/** Reads the `display` of the form, a step, a section or a row, when it has one. */
export function readDisplay(shape: Shape, path: string): Partial<Record<'display', Display>> {
  return withOptional(
    'display',
    shape.display === undefined ? undefined : readDisplayAt(shape.display, `${path}.display`),
  )
}
