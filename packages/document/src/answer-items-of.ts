import type { ComputedItem, DocumentItem, FieldItem } from './form-document'
import { isLeaf } from './is-leaf'

/**
 * The items that give an answer, fields and computed values, among these items and inside their
 * rows and sections, in document order.
 */
export function answerItemsOf(items: readonly DocumentItem[]): (FieldItem | ComputedItem)[] {
  return items.flatMap((item) => {
    if (item.type === 'field' || item.type === 'computed') {
      return [item]
    }
    return isLeaf(item) ? [] : answerItemsOf(item.items)
  })
}
