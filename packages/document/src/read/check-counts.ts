import type { Condition } from '../condition'
import { conditionsOf } from '../conditions-of'
import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { DocumentItem, FormDocument } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import { optionListsOf } from '../option-lists-of'
import { pathTo } from '../path-to'
import { placedNodesOf } from '../placed-nodes-of'
import type { ReadLimits } from './read-limits'

type PlacedItem = { item: DocumentItem; path: string }

const OPTIONS_SETTING = 'options'

const itemsOf = (document: FormDocument): PlacedItem[] =>
  placedNodesOf(document).flatMap(({ node, path }) => (isStep(node) ? [] : [{ item: node, path }]))

const comparisonsIn = (condition: Condition): number => {
  if ('all' in condition) {
    return condition.all.reduce((sum, entry) => sum + comparisonsIn(entry), 0)
  }
  if ('any' in condition) {
    return condition.any.reduce((sum, entry) => sum + comparisonsIn(entry), 0)
  }
  return 1
}

const checkOptions = ({ item, path }: PlacedItem, limit: number): void => {
  const options =
    isLeaf(item) && item.type !== 'computed' ? item.settings?.[OPTIONS_SETTING] : undefined
  if (options === undefined) {
    return
  }
  for (const placed of optionListsOf(options, pathTo.setting(path, OPTIONS_SETTING))) {
    if (placed.list.length > limit) {
      failAt(placed.path, `more than ${limit} options (limit options).`)
    }
  }
}

/**
 * Checks that a document read holds no more items, comparisons in conditions and options of one
 * field or block than the limits allow.
 *
 * @throws At the document, or at the options of the field, beyond a limit.
 */
export function checkCounts(document: FormDocument, limits: ReadLimits): void {
  const items = itemsOf(document)
  if (items.length > limits.items) {
    failAt(DOCUMENT_PATH, `more than ${limits.items} items (limit items).`)
  }
  for (const placed of items) {
    checkOptions(placed, limits.options)
  }
  const comparisons = conditionsOf(document).reduce(
    (sum, { condition }) => sum + comparisonsIn(condition),
    0,
  )
  if (comparisons > limits.conditions) {
    failAt(
      DOCUMENT_PATH,
      `more than ${limits.conditions} comparisons in conditions (limit conditions).`,
    )
  }
}
