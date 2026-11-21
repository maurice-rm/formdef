import type { DocumentNode } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isDocument } from './is-document'
import type { Parent } from './parent'

/** The steps or items a parent holds, or `undefined` for a field or a block. */
export function childrenOf(parent: Parent): readonly DocumentNode[] | undefined {
  if (isDocument(parent)) {
    return parent.steps ?? parent.items
  }
  return isLeaf(parent) ? undefined : parent.items
}
