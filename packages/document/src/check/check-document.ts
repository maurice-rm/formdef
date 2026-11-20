import { answerItemsOf } from '../answer-items-of'
import { DOCUMENT_PATH } from '../document-path'
import type {
  BlockItem,
  DocumentItem,
  DocumentStep,
  FieldItem,
  FormDocument,
  Intro,
  Jump,
} from '../form-document'
import { jumpEndingsOf } from '../jump-endings-of'
import type { Catalog } from '../kinds/create-catalog'
import { optionValuesOf } from '../kinds/option-values-of'
import type { ValueType } from '../kinds/value-type'
import { pathTo } from '../path-to'
import type { Text } from '../text'
import type { VaryingText } from '../varying-text'
import { checkComputed } from './check-computed'
import { checkCondition } from './check-condition'
import { checkDisplay } from './check-display'
import { checkFixedText } from './check-fixed-text'
import { checkMessages } from './check-messages'
import { checkSettings } from './check-settings'
import { checkVaryingText } from './check-varying-text'
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

const checkDescription = (description: VaryingText | undefined, { walk, path }: At): void => {
  if (description !== undefined) {
    checkVaryingText(description, { walk, path: `${path}.description` })
  }
}

// The stepper and the section show these labels for the whole form, so they name no answers.
const checkHeading = (
  { label, description }: { label: Text; description?: VaryingText | undefined },
  { walk, path }: At,
): void => {
  checkFixedText(label, { walk, path: `${path}.label` })
  checkDescription(description, { walk, path })
}

const checkVisibleWhen = (
  item: { visibleWhen?: DocumentItem['visibleWhen'] },
  { walk, path }: At,
): void => {
  if (item.visibleWhen !== undefined) {
    checkCondition(item.visibleWhen, pathTo.visibleWhen(path), walk)
  }
}

// A check reads the answer it checks, so its field counts as earlier for its conditions.
const checkChecks = (field: FieldItem, { walk, path }: At): void => {
  field.checks?.forEach((check, index) => {
    const checkPath = `${path}.checks[${index}]`
    checkCondition(check.when, `${checkPath}.when`, walk)
    if (check.message !== undefined) {
      checkVaryingText(check.message, { walk, path: `${checkPath}.message` })
    }
  })
}

// Fields, blocks and computed values share one space of keys.
const checkLeafKey = (key: string, { walk, path }: At, seenKeys: Set<string>): void => {
  if (seenKeys.has(key)) {
    report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key } })
  }
  seenKeys.add(key)
  checkKey(key, { walk, path })
}

const checkField = (field: FieldItem, { walk, path }: At, seenKeys: Set<string>): void => {
  checkLeafKey(field.key, { walk, path }, seenKeys)
  checkVaryingText(field.label, { walk, path: `${path}.label` })
  checkDescription(field.description, { walk, path })

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
  checkMessages(field, { walk, path })

  walk.earlier.set(field.key, {
    key: field.key,
    valueType: kind?.valueType,
    optionValues: optionValuesOf(field),
  })
  checkChecks(field, { walk, path })
}

const checkItems = (items: readonly DocumentItem[], level: Level): void => {
  if (items.length === 0) {
    report(level.at.walk, { code: 'empty', path: level.at.path })
  }
  items.forEach((item, index) => {
    checkItem(item, { ...level, at: { ...level.at, path: `${level.at.path}[${index}]` } })
  })
}

type BlockCheck = { seenKeys: Set<string>; checkTextOf?: typeof checkFixedText }

const checkBlock = (
  block: BlockItem,
  { walk, path }: At,
  { seenKeys, checkTextOf }: BlockCheck,
): void => {
  checkLeafKey(block.key, { walk, path }, seenKeys)

  const kind = walk.blockKindNamed(block.kind)
  if (kind === undefined) {
    report(walk, { code: 'unknownKind', path: `${path}.kind`, params: { kind: block.kind } })
  }
  checkVisibleWhen(block, { walk, path })
  if (kind !== undefined) {
    checkSettings(block, kind, {
      walk,
      path,
      ...(checkTextOf === undefined ? {} : { checkTextOf }),
    })
  }
}

// The intro shows before any answer, so its texts name none.
const checkIntro = (
  intro: Intro | undefined,
  { walk, seenKeys }: BlockCheck & { walk: CheckWalk },
): void => {
  if (intro === undefined) {
    return
  }
  const path = `${DOCUMENT_PATH}.intro`
  intro.items.forEach((block, index) => {
    checkBlock(
      block,
      { walk, path: `${path}.items[${index}]` },
      { seenKeys, checkTextOf: checkFixedText },
    )
  })
  checkFixedText(intro.start, { walk, path: `${path}.start` })
}

const checkItem = (item: DocumentItem, level: Level): void => {
  const { at, seenKeys } = level
  if (item.type === 'field') {
    checkField(item, at, seenKeys)
    return
  }
  if (item.type === 'block') {
    checkBlock(item, at, { seenKeys })
    return
  }
  if (item.type === 'computed') {
    checkLeafKey(item.key, at, seenKeys)
    checkVisibleWhen(item, at)
    checkComputed(item, at)
    return
  }
  if (item.type === 'section') {
    checkHeading(item, at)
  }
  checkVisibleWhen(item, at)
  checkDisplay(item.display, item.type, at)
  if (item.type === 'section' && level.sections + 1 > MOST_SECTION_LEVELS) {
    report(at.walk, { code: 'tooDeep', path: at.path })
  }
  checkItems(item.items, {
    at: { ...at, path: `${at.path}.items` },
    seenKeys,
    sections: item.type === 'section' ? level.sections + 1 : level.sections,
  })
}

/** Where the steps and endings of a document are, which jumps name. */
type Targets = { allStepKeys: readonly string[]; endingKeys: ReadonlySet<string> }

type StepOrder = Targets & { at: At; laterSteps: readonly string[] }

const checkJumpTarget = (jump: Jump, { at, laterSteps, allStepKeys, endingKeys }: StepOrder) => {
  if (jump.end !== undefined) {
    if (!endingKeys.has(jump.end)) {
      report(at.walk, {
        code: 'unknownEnding',
        path: `${at.path}.end`,
        params: { ending: jump.end },
      })
    }
    return
  }
  if (laterSteps.includes(jump.step)) {
    return
  }
  report(at.walk, {
    code: allStepKeys.includes(jump.step) ? 'backwardJump' : 'unknownStep',
    path: `${at.path}.step`,
    params: { step: jump.step },
  })
}

// A jump applies once the person moves on, so its condition reads the step's own answers too.
const checkJumps = (jumps: readonly Jump[] | undefined, order: StepOrder): void => {
  jumps?.forEach((jump, index) => {
    const jumpPath = `${order.at.path}.next[${index}]`
    checkCondition(jump.when, `${jumpPath}.when`, order.at.walk)
    checkJumpTarget(jump, { ...order, at: { ...order.at, path: jumpPath } })
  })
}

// Endings show once every answer is given, so their conditions and texts may name any of them.
// An ending a jump names applies only through it, so only the others take their turn in order.
const checkEndings = (
  document: FormDocument,
  { walk, seenKeys }: { walk: CheckWalk; seenKeys: Set<string> },
): void => {
  const endings = document.endings ?? []
  const jumpEndings = jumpEndingsOf(document)
  const lastInOrder = endings.reduce(
    (last, ending, index) => (jumpEndings.has(ending.key) ? last : index),
    -1,
  )
  const endingKeys = new Set<string>()
  endings.forEach((ending, index) => {
    const path = pathTo.entry(DOCUMENT_PATH, 'endings', index)
    if (endingKeys.has(ending.key)) {
      report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key: ending.key } })
    }
    endingKeys.add(ending.key)
    checkKey(ending.key, { walk, path })
    if (ending.when === undefined && !jumpEndings.has(ending.key) && index < lastInOrder) {
      report(walk, { code: 'fallbackNotLast', path })
    }
    if (ending.when !== undefined) {
      checkCondition(ending.when, `${path}.when`, walk)
    }
    ending.items.forEach((block, blockIndex) => {
      checkBlock(block, { walk, path: `${path}.items[${blockIndex}]` }, { seenKeys })
    })
  })
}

type StepWalk = { walk: CheckWalk; seenKeys: Set<string>; endingKeys: ReadonlySet<string> }

const checkSteps = (
  steps: readonly DocumentStep[],
  { walk, seenKeys, endingKeys }: StepWalk,
): void => {
  const allStepKeys = steps.map((step) => step.key)
  const stepKeys = new Set<string>()

  steps.forEach((step, index) => {
    const path = pathTo.entry(DOCUMENT_PATH, 'steps', index)
    if (stepKeys.has(step.key)) {
      report(walk, { code: 'duplicateKey', path: `${path}.key`, params: { key: step.key } })
    }
    stepKeys.add(step.key)
    checkKey(step.key, { walk, path })
    checkOverlap(step.key, allStepKeys, { walk, path })
    checkHeading(step, { walk, path })
    checkVisibleWhen(step, { walk, path })
    checkDisplay(step.display, 'step', { walk, path })
    checkItems(step.items, {
      at: { walk, path: `${path}.items` },
      seenKeys,
      sections: 0,
    })
    checkJumps(step.next, {
      at: { walk, path },
      laterSteps: allStepKeys.slice(index + 1),
      allStepKeys,
      endingKeys,
    })
  })
}

/**
 * Checks a form document as a form, once {@link readDocument} has checked its shape, and reports
 * every problem in document order: keys used twice, conditions on fields that do not exist or come
 * later, operators and compared values that do not fit the field compared, empty steps, sections
 * and rows, sections nested too deep, unknown field, block and display kinds, displays where their
 * kind does not apply, and settings that are unknown, missing, of the wrong type or outside their
 * constraints.
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
    blockKindNamed: (name) => catalog.findBlockKind(name),
    displayKindNamed: (name) => catalog.findDisplayKind(name),
    valueTypeNamed: (name) => catalog.valueTypes.find((valueType) => valueType.name === name),
    languages: document.languages,
    allFieldKeys: new Set(answerItemsOf(items).map((item) => item.key)),
    earlier: new Map(),
    problems: [],
  }

  checkDisplay(document.display, document.steps === undefined ? undefined : 'form', {
    walk,
    path: DOCUMENT_PATH,
  })
  const seenKeys = new Set<string>()
  checkIntro(document.intro, { walk, seenKeys })
  if (document.steps === undefined) {
    checkItems(document.items, {
      at: { walk, path: `${DOCUMENT_PATH}.items` },
      seenKeys,
      sections: 0,
    })
  } else {
    const endingKeys = new Set((document.endings ?? []).map((ending) => ending.key))
    checkSteps(document.steps, { walk, seenKeys, endingKeys })
  }
  checkEndings(document, { walk, seenKeys })

  return walk.problems
}
