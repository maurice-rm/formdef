import { failAt } from '../fail-at'
import type { BlockItem, DocumentItem, Ending } from '../form-document'
import { readCondition } from './read-condition'
import { readItems } from './read-items'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readShape } from './read-shape'
import { readText } from './read-text'
import { withOptional } from './with-optional'

const ENDING_KEYS = ['key', 'when', 'items']

const blockOf = (item: DocumentItem, path: string): BlockItem =>
  item.type === 'block' ? item : failAt(`${path}.type`, 'expected one of block.')

const readEnding = (value: unknown, path: string): Ending => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, ENDING_KEYS, path)
  const itemsPath = `${path}.items`
  const items = readItems(shape.items, itemsPath).map((item, index) =>
    blockOf(item, `${itemsPath}[${index}]`),
  )
  return {
    key: readText(shape.key, `${path}.key`),
    ...withOptional(
      'when',
      shape.when === undefined ? undefined : readCondition(shape.when, `${path}.when`),
    ),
    items,
  }
}

/** Reads the endings of a document: each a key, an optional condition and blocks. */
export function readEndings(value: unknown, path: string): Ending[] {
  return readList(value, path).map((entry, index) => readEnding(entry, `${path}[${index}]`))
}
