import { DOCUMENT_PATH } from '../document-path'
import { fieldsOf } from '../fields-of'
import type { DocumentItem, DocumentStep, FieldItem, FormDocument } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { pathTo } from '../path-to'
import type { Text } from '../text'
import { checkCondition } from './check-condition'
import { checkSettings } from './check-settings'
import { checkText } from './check-text'
import type { CheckWalk } from './check-walk'
import type { Problem } from './problem'
import { report } from './report'

type At = { walk: CheckWalk; path: string }

type Level = { at: At; seenKeys: Set<string>; sections: number }

const MOST_SECTION_LEVELS = 2

// A key becomes a path in the form's values, where a dot or a bracket would nest it.
const PLAIN_KEY = /^[^.[\]]+$/

const checkKey = (key: string, { walk, path }: At): void => {
  if (PLAIN_KEY.test(key)) {
    return
  }
  report(walk, { code: 'invalidKey', path: `${path}.key`, params: { key } })
}

// TanStack's form group of a step counts every field whose path starts with the step's key.
const checkOverlap = (key: string, stepKeys: readonly string[], { walk, path }: At): void => {
  const start = stepKeys.find((other) => other !== '' && other !== key && key.startsWith(other))
  if (start === undefined) {
    return
  }
  report(walk, { code: 'overlappingKey', path: `${path}.key`, params: { key, start } })
}

const checkTexts = (
  { label, description }: { label: Text; description?: Text },
  { walk, path }: At,
): void => {
  checkText(label, { walk, path: `${path}.label` })
  if (description !== undefined) {
    checkText(description, { walk, path: `${path}.description` })
  }
}

const checkVisibleWhen = (
  item: { visibleWhen?: DocumentItem['visibleWhen'] },
  { walk, path }: At,
): void => {
  if (item.visibleWhen !== undefined) {
    checkCondition(item.visibleWhen, pathTo.visibleWhen(path), walk)
  }
}

const checkField = (field: FieldItem, { walk, path }: At, seenKeys: Set<string>): void => {
  if (seenKeys.has(field.key)) {
    report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key: field.key } })
  }
  seenKeys.add(field.key)
  checkKey(field.key, { walk, path })
  checkTexts(field, { walk, path })

  const kind = walk.kindNamed(field.kind)
  if (kind === undefined) {
    report(walk, { code: 'unknownKind', path: `${path}.kind`, params: { kind: field.kind } })
  }
  checkVisibleWhen(field, { walk, path })
  if (typeof field.required === 'object') {
    checkCondition(field.required, pathTo.required(path), walk)
  }
  if (kind !== undefined) {
    checkSettings(field, kind, { walk, path })
  }

  walk.earlier.set(field.key, { field, kind })
}

const checkItems = (items: readonly DocumentItem[], level: Level): void => {
  if (items.length === 0) {
    report(level.at.walk, { code: 'empty', path: level.at.path })
  }
  items.forEach((item, index) => {
    checkItem(item, { ...level, at: { ...level.at, path: `${level.at.path}[${index}]` } })
  })
}

const checkItem = (item: DocumentItem, level: Level): void => {
  const { at, seenKeys } = level
  if (item.type === 'field') {
    checkField(item, at, seenKeys)
    return
  }
  if (item.type === 'section') {
    checkTexts(item, at)
  }
  checkVisibleWhen(item, at)
  if (item.type === 'section' && level.sections + 1 > MOST_SECTION_LEVELS) {
    report(at.walk, { code: 'tooDeep', path: at.path })
  }
  checkItems(item.items, {
    at: { ...at, path: `${at.path}.items` },
    seenKeys,
    sections: item.type === 'section' ? level.sections + 1 : level.sections,
  })
}

const checkSteps = (steps: readonly DocumentStep[], walk: CheckWalk): void => {
  const allStepKeys = steps.map((step) => step.key)
  const stepKeys = new Set<string>()
  const fieldKeys = new Set<string>()

  steps.forEach((step, index) => {
    const path = pathTo.entry(DOCUMENT_PATH, 'steps', index)
    if (stepKeys.has(step.key)) {
      report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key: step.key } })
    }
    stepKeys.add(step.key)
    checkKey(step.key, { walk, path })
    checkOverlap(step.key, allStepKeys, { walk, path })
    checkTexts(step, { walk, path })
    checkVisibleWhen(step, { walk, path })
    checkItems(step.items, {
      at: { walk, path: `${path}.items` },
      seenKeys: fieldKeys,
      sections: 0,
    })
  })
}

/**
 * Checks a form document as a form, once {@link readDocument} has checked its shape, and reports
 * every problem in document order: keys used twice, conditions on fields that do not exist or come
 * later, operators and compared values that do not fit the field compared, empty steps, sections
 * and rows, sections nested too deep, unknown field kinds, and settings that are unknown, missing,
 * of the wrong type or outside their constraints.
 *
 * A builder lists the problems while a document is edited; rendering refuses a document that has
 * any.
 *
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses.
 * @returns Every problem found; empty when the document is sound.
 *
 * @example
 * ```ts
 * const problems = checkDocument(document, catalog)
 * if (problems.length > 0) showProblems(problems)
 * ```
 */
export function checkDocument(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
): Problem[] {
  const items =
    document.steps === undefined ? document.items : document.steps.flatMap((step) => step.items)
  const walk: CheckWalk = {
    kindNamed: (name) => catalog.findFieldKind(name),
    languages: document.languages,
    allFieldKeys: new Set(fieldsOf(items).map((field) => field.key)),
    earlier: new Map(),
    problems: [],
  }

  if (document.steps === undefined) {
    checkItems(document.items, {
      at: { walk, path: `${DOCUMENT_PATH}.items` },
      seenKeys: new Set(),
      sections: 0,
    })
  } else {
    checkSteps(document.steps, walk)
  }

  return walk.problems
}
