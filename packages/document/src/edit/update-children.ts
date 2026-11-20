import type { DocumentNode, FormDocument } from '../form-document'
import type { Position } from '../position'
import { childrenOf } from './children-of'
import { failAtPosition } from './fail-at-position'
import type { Parent } from './parent'
import { splice } from './splice'
import { withChildren } from './with-children'

/** Where the children change, and the position the operation names in its errors. */
export type Target = { parent: Position; position: Position }

type ChildrenUpdate = (children: readonly DocumentNode[], parent: Parent) => readonly DocumentNode[]

const updateBelow = (
  parent: Parent,
  { parent: rest, position }: Target,
  update: ChildrenUpdate,
): Parent => {
  const children = childrenOf(parent) ?? failAtPosition(position, 'a field holds no items.')
  const [index, ...deeper] = rest
  if (index === undefined) {
    return withChildren(parent, update(children, parent))
  }

  const child = children[index] ?? failAtPosition(position, 'there is no such place.')
  const updated = updateBelow(child, { parent: deeper, position }, update) as DocumentNode
  return withChildren(parent, splice(children, { index, removed: 1 }, updated))
}

/**
 * Returns the document with the children of the node at `target.parent`, `[]` for the root,
 * replaced by what `update` returns.
 *
 * @throws When no node sits there, or it is a field.
 */
export function updateChildren(
  document: FormDocument,
  target: Target,
  update: ChildrenUpdate,
): FormDocument {
  return updateBelow(document, target, update) as FormDocument
}
