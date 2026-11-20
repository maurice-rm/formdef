import { fieldsOf } from '../fields-of'
import type { DocumentItem, DocumentStep, FieldItem, FormDocument } from '../form-document'
import type { FieldKinds } from '../kinds/create-field-kinds'
import { checkCondition } from './check-condition'
import { checkSettings } from './check-settings'
import type { Problem } from './problem'
import { report, type Walk } from './walk'

const ROOT = 'document'
const MOST_SECTION_LEVELS = 2

type At = { walk: Walk; path: string }

const checkVisibleWhen = (
  item: { visibleWhen?: DocumentItem['visibleWhen'] },
  { walk, path }: At,
): void => {
  if (item.visibleWhen !== undefined) checkCondition(item.visibleWhen, `${path}.visibleWhen`, walk)
}

const checkField = (field: FieldItem, { walk, path }: At, seenKeys: Set<string>): void => {
  if (seenKeys.has(field.key)) {
    report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key: field.key } })
  }
  seenKeys.add(field.key)

  const kind = walk.kindOf(field.kind)
  if (kind === undefined) {
    report(walk, { code: 'unknownKind', path: `${path}.kind`, params: { kind: field.kind } })
  }
  checkVisibleWhen(field, { walk, path })
  if (typeof field.required === 'object') checkCondition(field.required, `${path}.required`, walk)
  if (kind !== undefined) checkSettings(field, kind, { walk, path })

  walk.earlier.set(field.key, { field, kind })
}

type Level = { at: At; seenKeys: Set<string>; sections: number }

const checkItems = (items: readonly DocumentItem[], level: Level): void => {
  if (items.length === 0) report(level.at.walk, { code: 'empty', path: level.at.path })
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

const checkSteps = (steps: readonly DocumentStep[], walk: Walk): void => {
  const stepKeys = new Set<string>()
  const fieldKeys = new Set<string>()

  steps.forEach((step, index) => {
    const path = `${ROOT}.steps[${index}]`
    if (stepKeys.has(step.key)) {
      report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key: step.key } })
    }
    stepKeys.add(step.key)
    checkVisibleWhen(step, { walk, path })
    checkItems(step.items, {
      at: { walk, path: `${path}.items` },
      seenKeys: fieldKeys,
      sections: 0,
    })
  })
}

/**
 * Checks a form document as a form, once `readDocument` has checked its shape, and reports every
 * problem in document order: keys used twice, conditions on fields that do not exist or come
 * later, operators and compared values that do not fit the field compared, empty steps, sections
 * and rows, sections nested too deep, unknown field kinds, and settings that are unknown, missing,
 * of the wrong type or outside their constraints.
 *
 * A builder lists the problems while a document is edited; rendering refuses a document that has
 * any.
 *
 * @param document - The document, as `readDocument` returns it.
 * @param kinds - The field kinds the document's fields are of.
 * @returns Every problem found; empty when the document is sound.
 *
 * @example
 * ```ts
 * const problems = checkDocument(document, fieldKinds)
 * if (problems.length > 0) showProblems(problems)
 * ```
 */
export const checkDocument = (document: FormDocument, kinds: FieldKinds<unknown>): Problem[] => {
  const items =
    document.steps === undefined ? document.items : document.steps.flatMap((step) => step.items)
  const walk: Walk = {
    kindOf: (name) => kinds.byName(name),
    allFieldKeys: new Set(fieldsOf(items).map((field) => field.key)),
    earlier: new Map(),
    problems: [],
  }

  if (document.steps === undefined) {
    checkItems(document.items, {
      at: { walk, path: `${ROOT}.items` },
      seenKeys: new Set(),
      sections: 0,
    })
  } else {
    checkSteps(document.steps, walk)
  }

  return walk.problems
}
