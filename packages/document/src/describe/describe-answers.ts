import { refuseProblems } from '../check/refuse-problems'
import {
  evaluate,
  type ShownComputed,
  type ShownField,
  type ShownRepeat,
} from '../evaluate/evaluate'
import { resolveVaryingText } from '../evaluate/resolve-varying-text'
import type {
  BlockItem,
  ComputedItem,
  DocumentItem,
  FieldItem,
  FormDocument,
  RepeatItem,
} from '../form-document'
import { isLeaf } from '../is-leaf'
import type { JsonValue } from '../json-value'
import type { Catalog } from '../kinds/create-catalog'
import { optionsOf } from '../kinds/options-of'
import type { SettingOption } from '../kinds/setting'
import type { ValueType } from '../kinds/value-type'
import type { BuiltInValueType } from '../kinds/value-types'
import { languageOf } from '../language-of'
import type { ValuePath } from '../nest-values'
import { resolveFixedText } from '../resolve-fixed-text'
import { resolveNumberedText } from '../resolve-numbered-text'

type DescribedOf<TValueType> =
  TValueType extends ValueType<unknown, infer TName, infer TDescribed>
    ? {
        /** The name of the answer's value type. */
        valueType: TName
      } & TDescribed
    : never

/**
 * A filled answer, as its value type describes it, next to the value type's name: `{ value }`
 * for text, a decimal as written, a date as an ISO string, a number, and a boolean, which is
 * filled only when true; the option, with its `value` and `label`, for one choice; `{ values }`,
 * the options in the order of the answer, for several choices; and the shape a project's value
 * type describes.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedAnswer<TValueType extends ValueType = never> = DescribedOf<
  BuiltInValueType | TValueType
>

/**
 * A field that shows, with its question and its answer.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedField<TValueType extends ValueType = never> = {
  /** Marks the item as a field. */
  type: 'field'
  /** The field's key. */
  key: string
  /** The question. */
  label: string
  /** The name of the field's kind, to format the answer by, such as with a unit. */
  kind: string
  /** The field's settings for these answers, such as the unit that applies. */
  settings: Readonly<Record<string, JsonValue>>
  /**
   * The answer; `undefined` when the field was left empty, holds a value of the wrong type or no
   * option of the field.
   */
  answer: DescribedAnswer<TValueType> | undefined
}

/**
 * A computed value that counts, with what it is called and what it came to.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedComputed<TValueType extends ValueType = never> = {
  /** Marks the item as a computed value. */
  type: 'computed'
  /** The computed value's key. */
  key: string
  /** What the value is called. */
  label: string
  /** What it came to; `undefined` when it is empty, such as while an operand has no answer. */
  answer: DescribedAnswer<TValueType> | undefined
}

/**
 * A section that shows, with the fields and sections in it that show.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedSection<TValueType extends ValueType = never> = {
  /** Marks the item as a section. */
  type: 'section'
  /** The section's title. */
  label: string
  /** What shows in it, in document order; the fields of a row stand one after another. */
  items: DescribedItem<TValueType>[]
}

/**
 * One entry of a repeat, with what shows in it, read from that entry.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedEntry<TValueType extends ValueType = never> = {
  /** The entry's number, from 1. */
  number: number
  /** The entry's title, its number filled in; only when the repeat has an `entryLabel`. */
  label?: string
  /** What shows in it, in document order. */
  items: DescribedItem<TValueType>[]
}

/**
 * A repeat that shows, with each of its entries; without entries, its list is empty.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedRepeat<TValueType extends ValueType = never> = {
  /** Marks the item as a repeat. */
  type: 'repeat'
  /** The repeat's key. */
  key: string
  /** The repeat's title. */
  label: string
  /** Its entries, in order. */
  entries: DescribedEntry<TValueType>[]
}

/**
 * One item of a description: a field, a computed value, a section or a repeat.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedItem<TValueType extends ValueType = never> =
  | DescribedField<TValueType>
  | DescribedComputed<TValueType>
  | DescribedSection<TValueType>
  | DescribedRepeat<TValueType>

/**
 * A step that shows, with what shows in it.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedStep<TValueType extends ValueType = never> = {
  /** The step's key. */
  key: string
  /** The step's name. */
  label: string
  /** What shows in it, in document order. */
  items: DescribedItem<TValueType>[]
}

/**
 * The answers of a document, described: by step in a document with steps, by item without.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type AnswerDescription<TValueType extends ValueType = never> =
  | {
      /** The steps that show, in document order, each with what shows in it. */
      steps: DescribedStep<TValueType>[]
    }
  | {
      /** What shows in a document without steps, in document order. */
      items: DescribedItem<TValueType>[]
    }

/** What {@link describeAnswers} takes besides the document and its catalog. */
export type DescribeOptions = {
  /** The values given, nested by step key in a document with steps, flat without. */
  values: unknown
  /**
   * The language of the questions, sections and options; a language the document does not name
   * gives its first.
   *
   * @defaultValue the document's first language
   */
  language?: string
}

// A path holds keys and the indexes of entries, so its JSON tells every place apart.
const keyOf = (path: ValuePath): string => JSON.stringify(path)

type Described = {
  fieldsAt: ReadonlyMap<string, ShownField>
  computedAt: ReadonlyMap<string, ShownComputed>
  repeatsAt: ReadonlyMap<string, ShownRepeat>
  language: string | undefined
}

/** Where the items being described sit: their step, and their repeat and entry. */
type Place = { described: Described; path: ValuePath }

type AnyDescribedItem = DescribedItem<ValueType>

const describeAnswer = (shown: ShownField): DescribedAnswer<ValueType> | undefined => {
  const answer = shown.answers.get(shown.field.key)
  if (answer === undefined) {
    return undefined
  }
  const { value, valueType } = answer
  // The settings of a field that shows are resolved, so their options hold strings.
  const options = optionsOf(shown.settings) as SettingOption[]
  const described = valueType.describe(value, options)
  return described === undefined ? undefined : { ...described, valueType: valueType.name }
}

const describeField = (shown: ShownField, language: string | undefined): AnyDescribedItem => ({
  type: 'field',
  key: shown.field.key,
  label: resolveVaryingText(shown.field.label, { answers: shown.answers, language }),
  kind: shown.kind.name,
  settings: shown.settings,
  answer: describeAnswer(shown),
})

const describeComputed = (shown: ShownComputed, language: string | undefined): AnyDescribedItem => {
  const { computed, answers } = shown
  const answer = answers.get(computed.key)
  const answerDescribed = answer?.valueType.describe(answer.value, [])
  return {
    type: 'computed',
    key: computed.key,
    label: resolveVaryingText(computed.label, { answers, language }),
    answer:
      answer === undefined || answerDescribed === undefined
        ? undefined
        : { ...answerDescribed, valueType: answer.valueType.name },
  }
}

const describeRepeat = (repeat: RepeatItem, { described, path }: Place): AnyDescribedItem[] => {
  const repeatPath = [...path, repeat.key]
  const shown = described.repeatsAt.get(keyOf(repeatPath))
  if (shown === undefined) {
    return []
  }
  const { language } = described
  const entries = Array.from({ length: shown.entries }, (_, index) => {
    const number = index + 1
    return {
      number,
      ...(repeat.entryLabel === undefined
        ? {}
        : { label: resolveNumberedText(repeat.entryLabel, { language, number }) }),
      items: describeItems(repeat.items, { described, path: [...repeatPath, index] }),
    }
  })
  const label = resolveFixedText(repeat.label, language)
  return [{ type: 'repeat', key: repeat.key, label, entries }]
}

const describeLeaf = (
  item: FieldItem | BlockItem | ComputedItem,
  { described, path }: Place,
): AnyDescribedItem[] => {
  if (item.type === 'field') {
    const shown = described.fieldsAt.get(keyOf([...path, item.key]))
    return shown === undefined ? [] : [describeField(shown, described.language)]
  }
  if (item.type === 'computed') {
    const shown = described.computedAt.get(keyOf([...path, item.key]))
    return shown === undefined ? [] : [describeComputed(shown, described.language)]
  }
  return []
}

const describeItems = (items: readonly DocumentItem[], place: Place): AnyDescribedItem[] =>
  items.flatMap((item): AnyDescribedItem[] => {
    if (isLeaf(item)) {
      return describeLeaf(item, place)
    }
    if (item.type === 'repeat') {
      return describeRepeat(item, place)
    }
    const inner = describeItems(item.items, place)
    if (item.type === 'row' || inner.length === 0) {
      return inner
    }
    const label = resolveFixedText(item.label, place.described.language)
    return [{ type: 'section', label, items: inner }]
  })

const describeDocument = (
  document: FormDocument,
  described: Described,
): AnswerDescription<ValueType> => {
  if (document.steps === undefined) {
    return { items: describeItems(document.items, { described, path: [] }) }
  }
  return {
    steps: document.steps.flatMap((step) => {
      const items = describeItems(step.items, { described, path: [step.key] })
      const label = resolveFixedText(step.label, described.language)
      return items.length === 0 ? [] : [{ key: step.key, label, items }]
    }),
  }
}

/**
 * Describes the answers of a form document: each field that shows with its question and its
 * answer, and each computed value that counts with what it came to, in document order, within the
 * steps and sections that show, in a language. A repeat that shows lists its entries, each with
 * its number and, with an `entryLabel`, its title, and what shows in it. Each answer
 * is described by its value type; a field left empty, or holding a value of the wrong type or no
 * option of the field, has no answer. A server describes the answers the validator returned, such
 * as for an email or a PDF; formatting them, such as a boolean as yes or a decimal with its unit,
 * is the project's.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses.
 * @param options - The values given and the language.
 * @param options.values - The values given, nested by step key in a document with steps, flat
 *   without.
 * @param options.language - The language of the questions, sections and options.
 * @defaultValue `options.language`: the document's first language.
 * @returns The description; a step or section with nothing that shows is left out, a repeat
 *   without entries is kept with an empty list.
 * @throws When the document has problems, as {@link checkDocument} reports them.
 *
 * @example
 * ```ts
 * const result = createValidator(document, catalog)['~standard'].validate(values)
 * if (result.issues === undefined) {
 *   await sendSummary(describeAnswers(document, catalog, { values: result.value, language: 'de' }))
 * }
 * ```
 */
export function describeAnswers<TValueType extends ValueType = never>(
  document: FormDocument,
  catalog: Catalog<unknown, TValueType>,
  options: DescribeOptions,
): AnswerDescription<TValueType> {
  refuseProblems(document, catalog)
  const language = languageOf(document, options.language)
  const { shown, computed, repeats } = evaluate(document, catalog, {
    values: options.values,
    language,
  })
  const described: Described = {
    fieldsAt: new Map(shown.map((entry) => [keyOf(entry.path), entry])),
    computedAt: new Map(computed.map((entry) => [keyOf(entry.path), entry])),
    repeatsAt: new Map(repeats.map((entry) => [keyOf(entry.path), entry])),
    language,
  }

  // The value types describe their answers at runtime; the catalog's type names their shapes.
  return describeDocument(document, described) as AnswerDescription<TValueType>
}
