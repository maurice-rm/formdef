import type { Ending } from '../form-document'
import { readBlocks } from './read-blocks'
import { readCondition } from './read-condition'
import { readEach } from './read-each'
import { readOnlyKeys } from './read-only-keys'
import { readOptional } from './read-optional'
import { readShape } from './read-shape'
import { readText } from './read-text'

const ENDING_KEYS = ['key', 'when', 'items']

const readEnding = (value: unknown, path: string): Ending => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, ENDING_KEYS, path)
  return {
    key: readText(shape.key, `${path}.key`),
    ...readOptional(shape, 'when', { path, read: readCondition }),
    items: readBlocks(shape.items, `${path}.items`),
  }
}

/** Reads the endings of a document: each a key, an optional condition and blocks. */
export function readEndings(value: unknown, path: string): Ending[] {
  return readEach(value, path, readEnding)
}
