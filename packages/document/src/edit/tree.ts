import type { DocumentNode, FormDocument, RowItem, SectionItem } from '../form-document'
import { isField } from './is-field'
import { isStep } from './is-step'
import { failAtPosition, type Position } from './position'

type Parent = FormDocument | DocumentNode

type ChildrenUpdate = (children: readonly DocumentNode[], parent: Parent) => readonly DocumentNode[]

/** Where the children change, and the position the operation names in its errors. */
type Target = { parent: Position; position: Position }

/** The list with `inserted` in place of the `removed` entries from `index` on, as a copy. */
export const splice = <TEntry>(
  list: readonly TEntry[],
  { index, removed }: { index: number; removed: number },
  ...inserted: TEntry[]
): TEntry[] => [...list.slice(0, index), ...inserted, ...list.slice(index + removed)]

const isDocument = (parent: Parent): parent is FormDocument => 'format' in parent

const childrenOf = (parent: Parent): readonly DocumentNode[] | undefined => {
  if (isDocument(parent)) return parent.steps ?? parent.items
  return isField(parent) ? undefined : parent.items
}

// The children's types follow the parent; `refuseMisfit` checks each child before it is placed.
const withChildren = (parent: Parent, children: readonly DocumentNode[]): Parent => {
  if (!isDocument(parent)) return { ...parent, items: children as RowItem['items'] } as Parent
  return parent.steps === undefined
    ? { ...parent, items: children as SectionItem['items'] }
    : { ...parent, steps: children as NonNullable<FormDocument['steps']> }
}

/**
 * Checks that a parent may hold a node: a document with steps holds steps, a row holds fields,
 * and the rest hold fields, rows and sections.
 *
 * @throws Error when it may not.
 */
export const refuseMisfit = (parent: Parent, node: DocumentNode, position: Position): void => {
  const holdsSteps = isDocument(parent) && parent.steps !== undefined
  if (holdsSteps && !isStep(node)) {
    failAtPosition(position, 'a form with steps holds steps only.')
  }
  if (!holdsSteps && isStep(node)) {
    failAtPosition(position, 'a step goes only into the steps of a form.')
  }
  const isRow = !isDocument(parent) && !isStep(parent) && parent.type === 'row'
  if (isRow && !isField(node)) failAtPosition(position, 'a row holds fields only.')
}

const updateBelow = (
  parent: Parent,
  { parent: rest, position }: Target,
  update: ChildrenUpdate,
): Parent => {
  const children = childrenOf(parent) ?? failAtPosition(position, 'a field holds no items.')
  const [index, ...deeper] = rest
  if (index === undefined) return withChildren(parent, update(children, parent))

  const child = children[index] ?? failAtPosition(position, 'there is no such place.')
  const updated = updateBelow(child, { parent: deeper, position }, update) as DocumentNode
  return withChildren(parent, splice(children, { index, removed: 1 }, updated))
}

/**
 * Returns the document with the children of the node at `target.parent`, `[]` for the root,
 * replaced by what `update` returns.
 *
 * @throws Error when no node sits there, or it is a field.
 */
export const updateChildren = (
  document: FormDocument,
  target: Target,
  update: ChildrenUpdate,
): FormDocument => updateBelow(document, target, update) as FormDocument

/**
 * The node at a position.
 *
 * @throws Error when no node sits there.
 */
export const nodeAt = (document: FormDocument, position: Position): DocumentNode => {
  let node: Parent = document
  for (const index of position) {
    node = childrenOf(node)?.[index] ?? failAtPosition(position, 'there is nothing here.')
  }
  return isDocument(node) ? failAtPosition(position, 'there is nothing here.') : node
}

/**
 * Splits a position into its parent's position and its index among the parent's children.
 *
 * @throws Error when the position is the root's.
 */
export const splitPosition = (position: Position): Target & { index: number } => {
  const index = position.at(-1) ?? failAtPosition(position, 'there is nothing here.')
  return { parent: position.slice(0, -1), position, index }
}
