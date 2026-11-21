import type { DocumentItem, FieldItem } from './form-document'
import { isLeaf } from './is-leaf'

/**
 * The fields among these items and inside their rows and sections, in document order; the fields
 * of a repeat belong to its entries, not to these items.
 */
export function fieldsOf(items: readonly DocumentItem[]): FieldItem[] {
  return items.flatMap((item) => {
    if (item.type === 'field') {
      return [item]
    }
    return isLeaf(item) || item.type === 'repeat' ? [] : fieldsOf(item.items)
  })
}
