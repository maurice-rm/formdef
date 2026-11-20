import { answerItemsOf } from '../answer-items-of'
import type { Condition } from '../condition'
import type {
  ComputedItem,
  DocumentItem,
  FieldItem,
  FormDocument,
  RepeatItem,
} from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import type { Catalog } from '../kinds/create-catalog'
import { entryCount } from '../kinds/entry-count'
import type { FieldKind } from '../kinds/field-kind'
import { kindOf } from '../kinds/kind-of'
import { optionsOf } from '../kinds/options-of'
import type { SettingOption } from '../kinds/setting'
import type { ValueType } from '../kinds/value-type'
import { valueTypeNamed } from '../kinds/value-type-named'
import type { ValuePath } from '../nest-values'
import { repeatsOf } from '../repeats-of'
import type { Answer, Answers } from './answers'
import { type Computed, compute } from './compute'
import { holds } from './holds'
import { isFilled } from './is-filled'
import { isRequired } from './is-required'
import { resolveSettings } from './resolve-settings'

/** A field that shows for the values given, with what its answer is checked against. */
export type ShownField = {
  field: FieldItem
  kind: FieldKind<unknown>
  /** Where the field's value sits: its step, its repeat and entry, and its key. */
  path: ValuePath
  value: unknown
  isRequired: boolean
  settings: Readonly<Record<string, JsonValue>>
  /** The answers as the field reads them where it sits: inside a repeat, those of its entry. */
  answers: Answers
  /** How many fields and repeats that show come before it, to keep their issues in order. */
  order: number
}

/** A computed value that counts for the values given, with what it came to. */
export type ShownComputed = {
  computed: ComputedItem
  valueType: ValueType
  /** Where the value sits among the answers: its step, its repeat and entry, and its key. */
  path: ValuePath
  /** What it came to; `undefined` when it is empty. */
  value: Computed | undefined
  /** The answers as the value reads them where it sits, its own among them when filled. */
  answers: Answers
}

/** A repeat that shows for the values given, with its entries. */
export type ShownRepeat = {
  repeat: RepeatItem
  /** Where its list of entries sits: its step and its key. */
  path: ValuePath
  /** The value it holds, a list of entries when it is one. */
  value: unknown
  /** How many entries it holds; 0 when its value is no list. */
  entries: number
  /** The answers each entry reads, by the entry's index: those before the repeat and its own. */
  entryAnswers: Answers[]
  /** How many fields and repeats that show come before it, to keep their issues in order. */
  order: number
}

/** What a document's values come to: the fields that show, and the answers conditions compare. */
export type Evaluation = {
  /** The fields that show, in document order, those of each entry of a repeat in turn. */
  shown: ShownField[]
  /** The computed values that count, in document order. */
  computed: ShownComputed[]
  /** The repeats that show, in document order. */
  repeats: ShownRepeat[]
  /** The keys of the steps that show: by their condition, and not passed over by a jump. */
  shownSteps: Set<string>
  /** The step whose jump ends the form, and the ending it names; `undefined` without one. */
  end: { step: string; ending: string } | undefined
  answers: Answers
}

/** The values a document is evaluated for, and the language its texts are resolved in. */
export type EvaluationInput = {
  values: unknown
  /** The language, as {@link languageOf} chose it; `undefined` for a document of strings. */
  language: string | undefined
}

type EvaluationWalk = {
  catalog: Catalog<unknown, ValueType>
  language: string | undefined
  sources: AnswerSources
  filled: Map<string, Answer>
  answers: Answers
  shown: ShownField[]
  computed: ShownComputed[]
  repeats: ShownRepeat[]
  shownSteps: Set<string>
  end: Evaluation['end']
}

type Container = {
  values: Readonly<Record<string, unknown>>
  path: ValuePath
}

/** What every scope of answers shares: the value types, and the entries of each repeat walked. */
type AnswerSources = {
  valueTypes: ReadonlyMap<string, ValueType>
  entries: Map<string, readonly Answers[]>
  repeatOfKey: ReadonlyMap<string, string>
}

const objectOf = (value: unknown): Readonly<Record<string, unknown>> =>
  isPlainObject(value) ? value : {}

const NO_ENTRIES: readonly Answers[] = []

const answersOver = (filled: ReadonlyMap<string, Answer>, sources: AnswerSources): Answers => ({
  get: (key) => filled.get(key),
  valueTypeOf: (key) => sources.valueTypes.get(key),
  entriesOf: (repeat) => sources.entries.get(repeat) ?? NO_ENTRIES,
  repeatOf: (key) => sources.repeatOfKey.get(key),
})

const isShown = (item: { visibleWhen?: Condition }, walk: EvaluationWalk): boolean =>
  item.visibleWhen === undefined || holds(item.visibleWhen, walk.answers)

const nextOrder = (walk: EvaluationWalk): number => walk.shown.length + walk.repeats.length

const walkField = (field: FieldItem, container: Container, walk: EvaluationWalk): void => {
  const kind = kindOf(walk.catalog, field)
  const value = container.values[field.key]

  const settings = resolveSettings(field, kind, { answers: walk.answers, language: walk.language })
  walk.shown.push({
    field,
    kind,
    path: [...container.path, field.key],
    value,
    isRequired: isRequired(field, walk.answers),
    settings,
    answers: walk.answers,
    order: nextOrder(walk),
  })
  if (isFilled(value, kind.valueType)) {
    // The settings of a field that shows are resolved, so their options hold strings.
    const options = optionsOf(settings) as SettingOption[]
    const text = kind.valueType.toText(value, options)
    walk.filled.set(field.key, { value, valueType: kind.valueType, text, options })
  }
}

const walkComputed = (computed: ComputedItem, container: Container, walk: EvaluationWalk): void => {
  const valueType = valueTypeNamed(walk.catalog, computed.valueType)
  const value = compute(computed.expression, walk.answers)
  walk.computed.push({
    computed,
    valueType,
    path: [...container.path, computed.key],
    value,
    answers: walk.answers,
  })
  if (value !== undefined && valueType.isFilled(value)) {
    walk.filled.set(computed.key, {
      value,
      valueType,
      text: valueType.toText(value, []),
      options: [],
    })
  }
}

const valueTypeOfItem = (
  item: FieldItem | ComputedItem,
  catalog: Catalog<unknown, ValueType>,
): ValueType | undefined =>
  item.type === 'computed'
    ? catalog.valueTypes.find((valueType) => valueType.name === item.valueType)
    : catalog.findFieldKind(item.kind)?.valueType

const valueTypesOf = (
  items: readonly DocumentItem[],
  catalog: Catalog<unknown, ValueType>,
): ReadonlyMap<string, ValueType> =>
  new Map([
    ...answerItemsOf(items).flatMap((item) => {
      const valueType = valueTypeOfItem(item, catalog)
      return valueType === undefined ? [] : [[item.key, valueType] as const]
    }),
    ...repeatsOf(items).map((repeat) => [repeat.key, entryCount] as const),
  ])

const repeatOfKeyIn = (items: readonly DocumentItem[]): ReadonlyMap<string, string> =>
  new Map(
    repeatsOf(items).flatMap((repeat) =>
      answerItemsOf(repeat.items).map((item) => [item.key, repeat.key] as const),
    ),
  )

const sourcesOf = (document: FormDocument, catalog: Catalog<unknown, ValueType>): AnswerSources => {
  const items =
    document.steps === undefined ? document.items : document.steps.flatMap((step) => step.items)
  return {
    valueTypes: valueTypesOf(items, catalog),
    entries: new Map(),
    repeatOfKey: repeatOfKeyIn(items),
  }
}

const walkItems = (
  items: readonly DocumentItem[],
  container: Container,
  walk: EvaluationWalk,
): void => {
  for (const item of items) {
    if (item.type === 'block' || !isShown(item, walk)) {
      continue
    }
    if (item.type === 'field') {
      walkField(item, container, walk)
    } else if (item.type === 'computed') {
      walkComputed(item, container, walk)
    } else if (item.type === 'repeat') {
      walkRepeat(item, container, walk)
    } else {
      walkItems(item.items, container, walk)
    }
  }
}

// Each entry reads the answers before the repeat and its own; nothing after it reads an entry.
const walkRepeat = (repeat: RepeatItem, container: Container, walk: EvaluationWalk): void => {
  const value = container.values[repeat.key]
  const entries: readonly unknown[] = Array.isArray(value) ? value : []
  const path = [...container.path, repeat.key]
  const entryAnswers: Answers[] = []
  walk.repeats.push({
    repeat,
    path,
    value,
    entries: entries.length,
    entryAnswers,
    order: nextOrder(walk),
  })
  entries.forEach((entry, index) => {
    const filled = new Map(walk.filled)
    const answers = answersOver(filled, walk.sources)
    entryAnswers.push(answers)
    const entryWalk = { ...walk, filled, answers }
    walkItems(repeat.items, { values: objectOf(entry), path: [...path, index] }, entryWalk)
  })
  walk.sources.entries.set(repeat.key, entryAnswers)
  if (entryCount.isFilled(entries.length)) {
    const count = entries.length
    walk.filled.set(repeat.key, {
      value: count,
      valueType: entryCount,
      text: entryCount.toText(count, []),
      options: [],
    })
  }
}

/**
 * Evaluates a document for these values, its settings resolved in the language. A field shows
 * when it and every step, section, row and repeat around it show; a field that does not show
 * counts as empty in the conditions after it, whatever value it still holds. The items of a repeat
 * are evaluated for each of its entries, reading the answers of that entry and those before the
 * repeat. A step a jump passes over does not show, nor does any step after a jump that ends the
 * form.
 *
 * @throws When a field is of a field kind that is not registered.
 */
export function evaluate(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  { values, language }: EvaluationInput,
): Evaluation {
  const filled = new Map<string, Answer>()
  const sources = sourcesOf(document, catalog)
  const walk: EvaluationWalk = {
    catalog,
    language,
    sources,
    filled,
    answers: answersOver(filled, sources),
    shown: [],
    computed: [],
    repeats: [],
    shownSteps: new Set(),
    end: undefined,
  }
  const root = objectOf(values)

  if (document.steps === undefined) {
    walkItems(document.items, { values: root, path: [] }, walk)
    return walk
  }
  let jumpTarget: string | undefined
  for (const step of document.steps) {
    if (jumpTarget !== undefined && step.key !== jumpTarget) {
      continue
    }
    jumpTarget = undefined
    if (!isShown(step, walk)) {
      continue
    }
    walkItems(step.items, { values: objectOf(root[step.key]), path: [step.key] }, walk)
    walk.shownSteps.add(step.key)
    const jump = step.next?.find((entry) => holds(entry.when, walk.answers))
    if (jump?.end !== undefined) {
      walk.end = { step: step.key, ending: jump.end }
      return walk
    }
    jumpTarget = jump?.step
  }
  return walk
}
