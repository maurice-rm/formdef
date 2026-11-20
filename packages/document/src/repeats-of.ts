import type { DocumentItem, RepeatItem } from './form-document'
import { isLeaf } from './is-leaf'

/** The repeats among these items and inside their rows and sections, in document order. */
export function repeatsOf(items: readonly DocumentItem[]): RepeatItem[] {
  return items.flatMap((item) => {
    if (item.type === 'repeat') {
      return [item]
    }
    return isLeaf(item) ? [] : repeatsOf(item.items)
  })
}
