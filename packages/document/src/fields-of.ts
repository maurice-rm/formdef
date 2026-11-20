import type { DocumentItem, FieldItem } from './form-document'

/** The fields among these items and inside their rows and sections, in document order. */
export function fieldsOf(items: readonly DocumentItem[]): FieldItem[] {
  return items.flatMap((item) => (item.type === 'field' ? [item] : fieldsOf(item.items)))
}
