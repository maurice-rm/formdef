import { failAt } from '../fail-at'
import type { BlockItem, DocumentItem } from '../form-document'
import { readItems } from './read-items'

const blockOf = (item: DocumentItem, path: string): BlockItem =>
  item.type === 'block' ? item : failAt(`${path}.type`, 'expected one of block.')

/** Reads the items of an intro or an ending, which hold blocks only. */
export function readBlocks(value: unknown, path: string): BlockItem[] {
  return readItems(value, path).map((item, index) => blockOf(item, `${path}[${index}]`))
}
