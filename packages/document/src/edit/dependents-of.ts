import { answerItemsOf } from '../answer-items-of'
import { conditionsOf } from '../conditions-of'
import { DOCUMENT_PATH } from '../document-path'
import type { DocumentNode, FormDocument } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import { jumpEndingsOf } from '../jump-endings-of'
import { nodesOf } from '../nodes-of'
import { pathTo } from '../path-to'
import { placeholdersIn } from '../placeholders-in'
import type { Position } from '../position'
import { repeatsOf } from '../repeats-of'
import { fieldsNamed } from './fields-named'
import { fieldsReadBy } from './fields-read-by'
import { nodeAt } from './node-at'

/**
 * A condition, placeholder, expression or jump that names a field or step of a node, or an ending
 * only a step's jumps reach, as {@link dependentsOf} lists it.
 */
export type Dependent = {
  /**
   * Where the condition, text, expression, jump or ending sits, as {@link checkDocument} names
   * paths.
   */
  path: string
  /** The key of the field, computed value, repeat or step it names, or whose jumps reach it. */
  key: string
}

const isWithin = (position: Position, ancestor: Position): boolean =>
  ancestor.every((index, depth) => position[depth] === index)

// A repeat is named by its key, which conditions compare by its number of entries.
const namedKeysUnder = (node: DocumentNode): string[] => {
  if (isLeaf(node)) {
    return node.type === 'block' ? [] : [node.key]
  }
  const own = !isStep(node) && node.type === 'repeat' ? [node.key] : []
  return [
    ...own,
    ...[...answerItemsOf(node.items), ...repeatsOf(node.items)].map((item) => item.key),
  ]
}

/**
 * Lists the conditions, placeholders and expressions that name a field, computed value or repeat of
 * a step or item, or the item itself, and the jumps to a step, which would lose it when the node is
 * removed: one per condition and key named, in document order, then one per placeholder,
 * then one per expression, then one per jump. Last come the endings only the step's own jumps
 * reach, which without them take their turn in order: by their condition, or as the fallback.
 * Those inside the node go with it and are left out. A builder shows them before it removes the
 * node.
 *
 * @param document - The document.
 * @param position - Where the node sits.
 * @returns What depends on the node's fields or on the step itself; empty when nothing does.
 * @throws When no node sits at the position.
 *
 * @example
 * ```ts
 * const dependents = dependentsOf(document, position)
 * if (dependents.length > 0) askBeforeRemoving(dependents)
 * ```
 */
export function dependentsOf(document: FormDocument, position: Position): Dependent[] {
  const node = nodeAt(document, position)
  const keys = new Set(namedKeysUnder(node))

  const fromConditions = conditionsOf(document)
    .filter((entry) => !isWithin(entry.position, position))
    .flatMap(({ condition, path }) =>
      fieldsNamed(condition)
        .filter((key) => keys.has(key))
        .map((key) => ({ path, key })),
    )
  const fromPlaceholders = placeholdersIn(document)
    .filter((entry) => !isWithin(entry.position, position) && keys.has(entry.field))
    .map(({ path, field }) => ({ path, key: field }))
  const fromExpressions = nodesOf(document)
    .filter((entry) => !isWithin(entry.position, position))
    .flatMap(({ node: other, path }) =>
      !isStep(other) && other.type === 'computed'
        ? fieldsReadBy(other.expression)
            .filter((key) => keys.has(key))
            .map((key) => ({ path: `${path}.expression`, key }))
        : [],
    )
  return [
    ...fromConditions,
    ...fromPlaceholders,
    ...fromExpressions,
    ...jumpsTo(document, node),
    ...endingsReachedOnlyFrom(document, node),
  ]
}

const endingsReachedOnlyFrom = (document: FormDocument, node: DocumentNode): Dependent[] => {
  if (!isStep(node) || document.steps === undefined) {
    return []
  }
  const ownEnds = new Set((node.next ?? []).flatMap((jump) => jump.end ?? []))
  const otherSteps = document.steps.filter((step) => step !== node)
  const otherEnds = jumpEndingsOf({ ...document, steps: otherSteps })
  return (document.endings ?? []).flatMap((ending, index) =>
    ownEnds.has(ending.key) && !otherEnds.has(ending.key)
      ? [{ path: pathTo.entry(DOCUMENT_PATH, 'endings', index), key: node.key }]
      : [],
  )
}

const jumpsTo = (document: FormDocument, node: DocumentNode): Dependent[] => {
  if (!isStep(node)) {
    return []
  }
  return (document.steps ?? []).flatMap((step, stepIndex) => {
    const stepPath = pathTo.entry(DOCUMENT_PATH, 'steps', stepIndex)
    return (step.next ?? []).flatMap((jump, jumpIndex) =>
      jump.step === node.key
        ? [{ path: `${stepPath}.next[${jumpIndex}].step`, key: node.key }]
        : [],
    )
  })
}
