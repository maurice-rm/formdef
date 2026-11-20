import type { DocumentNode } from '../form-document'
import { isDocument } from './is-document'
import { isField } from './is-field'
import type { Parent } from './parent'

/** The steps or items a parent holds, or `undefined` for a field. */
export function childrenOf(parent: Parent): readonly DocumentNode[] | undefined {
  if (isDocument(parent)) {
    return parent.steps ?? parent.items
  }
  return isField(parent) ? undefined : parent.items
}
