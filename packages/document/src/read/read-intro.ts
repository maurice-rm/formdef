import type { Intro } from '../form-document'
import { readBlocks } from './read-blocks'
import { readOnlyKeys } from './read-only-keys'
import { readShape } from './read-shape'
import { readTranslatableText } from './read-translatable-text'

const INTRO_KEYS = ['items', 'start']

/** Reads the intro of a document: blocks and the label of its start button. */
export function readIntro(value: unknown, path: string): Intro {
  const shape = readShape(value, path)
  readOnlyKeys(shape, INTRO_KEYS, path)
  return {
    items: readBlocks(shape.items, `${path}.items`),
    start: readTranslatableText(shape.start, `${path}.start`),
  }
}
