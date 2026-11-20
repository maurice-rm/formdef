import type { Ending } from '../form-document'
import { readBlocks } from './read-blocks'
import { readCondition } from './read-condition'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readShape } from './read-shape'
import { readText } from './read-text'
import { withOptional } from './with-optional'

const ENDING_KEYS = ['key', 'when', 'items']

const readEnding = (value: unknown, path: string): Ending => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, ENDING_KEYS, path)
  return {
    key: readText(shape.key, `${path}.key`),
    ...withOptional(
      'when',
      shape.when === undefined ? undefined : readCondition(shape.when, `${path}.when`),
    ),
    items: readBlocks(shape.items, `${path}.items`),
  }
}

/** Reads the endings of a document: each a key, an optional condition and blocks. */
export function readEndings(value: unknown, path: string): Ending[] {
  return readList(value, path).map((entry, index) => readEnding(entry, `${path}[${index}]`))
}
