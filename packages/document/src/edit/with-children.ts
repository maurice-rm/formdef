import type { DocumentNode, FormDocument, RowItem, SectionItem } from '../form-document'
import { isDocument } from './is-document'
import type { Parent } from './parent'

/** A copy of the parent that holds these children instead of its own. */
export function withChildren(parent: Parent, children: readonly DocumentNode[]): Parent {
  // The children's types follow the parent; `refuseMisfit` checks each child before it is placed.
  if (!isDocument(parent)) {
    return { ...parent, items: children as RowItem['items'] } as Parent
  }
  return parent.steps === undefined
    ? { ...parent, items: children as SectionItem['items'] }
    : { ...parent, steps: children as NonNullable<FormDocument['steps']> }
}
