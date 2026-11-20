import type { Condition } from '../condition'
import { conditionsOf } from '../conditions-of'
import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { DocumentItem, FormDocument } from '../form-document'
import { isLeaf } from '../is-leaf'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import { pathTo } from '../path-to'
import type { ReadLimits } from './read-limits'

type PlacedItem = { item: DocumentItem; path: string }

const OPTIONS_SETTING = 'options'

const placedIn = (items: readonly DocumentItem[], path: string): PlacedItem[] =>
  items.flatMap((item, index) => {
    const itemPath = pathTo.entry(path, 'items', index)
    const inner = isLeaf(item) ? [] : placedIn(item.items, itemPath)
    return [{ item, path: itemPath }, ...inner]
  })

const itemsOf = (document: FormDocument): PlacedItem[] => {
  const ofEndings = (document.endings ?? []).flatMap((ending, index) =>
    placedIn(ending.items, pathTo.entry(DOCUMENT_PATH, 'endings', index)),
  )
  const ofForm =
    document.steps === undefined
      ? placedIn(document.items, DOCUMENT_PATH)
      : document.steps.flatMap((step, index) =>
          placedIn(step.items, pathTo.entry(DOCUMENT_PATH, 'steps', index)),
        )
  return [...ofForm, ...ofEndings]
}

const comparisonsIn = (condition: Condition): number => {
  if ('all' in condition) {
    return condition.all.reduce((sum, entry) => sum + comparisonsIn(entry), 0)
  }
  if ('any' in condition) {
    return condition.any.reduce((sum, entry) => sum + comparisonsIn(entry), 0)
  }
  return 1
}

const checkOptionList = (value: JsonValue, { path, limit }: { path: string; limit: number }) => {
  if (Array.isArray(value) && value.length > limit) {
    failAt(path, `more than ${limit} options (limit options).`)
  }
}

const checkOptions = ({ item, path }: PlacedItem, limit: number): void => {
  const options =
    isLeaf(item) && item.type !== 'computed' ? item.settings?.[OPTIONS_SETTING] : undefined
  if (options === undefined) {
    return
  }
  const settingPath = pathTo.setting(path, OPTIONS_SETTING)
  if (!isVarying(options)) {
    checkOptionList(options, { path: settingPath, limit })
    return
  }
  options.cases.forEach((entry, index) => {
    checkOptionList(entry.value, { path: `${pathTo.case(settingPath, index)}.value`, limit })
  })
  checkOptionList(options.otherwise, { path: `${settingPath}.otherwise`, limit })
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
