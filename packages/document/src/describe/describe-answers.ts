import { refuseProblems } from '../check/refuse-problems'
import type { Answers } from '../evaluate/answers'
import { evaluate, type ShownField } from '../evaluate/evaluate'
import { resolveVaryingText } from '../evaluate/resolve-varying-text'
import type { DocumentItem, FormDocument } from '../form-document'
import type { JsonValue } from '../json-value'
import type { Catalog } from '../kinds/create-catalog'
import { optionsOf } from '../kinds/options-of'
import type { SettingOption } from '../kinds/setting'
import type { ValueType } from '../kinds/value-type'
import type { BuiltInValueType } from '../kinds/value-types'
import { languageOf } from '../language-of'
import { resolveFixedText } from '../resolve-fixed-text'

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
  /** Marks the entry as a field. */
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
 * A section that shows, with the fields and sections in it that show.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedSection<TValueType extends ValueType = never> = {
  /** Marks the entry as a section. */
  type: 'section'
  /** The section's title. */
  label: string
  /** What shows in it, in document order; the fields of a row stand one after another. */
  items: DescribedItem<TValueType>[]
}

/**
 * One entry of a description: a field or a section.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 */
export type DescribedItem<TValueType extends ValueType = never> =
  | DescribedField<TValueType>
  | DescribedSection<TValueType>

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
  /** The answers, nested by step key in a document with steps, flat without. */
  values: unknown
  /**
   * The language of the questions, sections and options; a language the document does not name
   * gives its first.
   *
   * @defaultValue the document's first language
   */
  language?: string
}

type Described = {
  shownByKey: ReadonlyMap<string, ShownField>
  answers: Answers
  language: string | undefined
}

type AnyDescribedItem = DescribedItem<ValueType>

const describeAnswer = (
  shown: ShownField,
  answers: Answers,
): DescribedAnswer<ValueType> | undefined => {
  const answer = answers.get(shown.field.key)
  if (answer === undefined) {
    return undefined
  }
  const { value, valueType } = answer
  // The settings of a field that shows are resolved, so their options hold strings.
  const options = optionsOf(shown.settings) as SettingOption[]
  const described = valueType.describe(value, options)
  return described === undefined ? undefined : { ...described, valueType: valueType.name }
}

const describeField = (shown: ShownField, described: Described): DescribedField<ValueType> => ({
  type: 'field',
  key: shown.field.key,
  label: resolveVaryingText(shown.field.label, described),
  kind: shown.kind.name,
  settings: shown.settings,
  answer: describeAnswer(shown, described.answers),
})

const describeItems = (items: readonly DocumentItem[], described: Described): AnyDescribedItem[] =>
  items.flatMap((item): AnyDescribedItem[] => {
    if (item.type === 'field') {
      const shown = described.shownByKey.get(item.key)
      return shown === undefined ? [] : [describeField(shown, described)]
    }
    const inner = describeItems(item.items, described)
    if (item.type === 'row' || inner.length === 0) {
      return inner
    }
    const label = resolveFixedText(item.label, described.language)
    return [{ type: 'section', label, items: inner }]
  })

const describeDocument = (
  document: FormDocument,
  described: Described,
): AnswerDescription<ValueType> => {
  if (document.steps === undefined) {
    return { items: describeItems(document.items, described) }
  }
  return {
    steps: document.steps.flatMap((step) => {
      const items = describeItems(step.items, described)
      const label = resolveFixedText(step.label, described.language)
      return items.length === 0 ? [] : [{ key: step.key, label, items }]
    }),
  }
}

/**
 * Describes the answers of a form document: each field that shows with its question and its
 * answer, in document order, within the steps and sections that show, in a language. Each answer
 * is described by its value type; a field left empty, or holding a value of the wrong type or no
 * option of the field, has no answer. A server describes the answers the validator returned, such
 * as for an email or a PDF; formatting them, such as a boolean as yes or a decimal with its unit,
 * is the project's.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses.
 * @param options - The answers and the language.
 * @param options.values - The answers, nested by step key in a document with steps, flat without.
 * @param options.language - The language of the questions, sections and options.
 * @defaultValue `options.language`: the document's first language.
 * @returns The description; a step or section with nothing that shows is left out.
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
  const { shown, answers } = evaluate(document, catalog, { values: options.values, language })
  const described = {
    shownByKey: new Map(shown.map((entry) => [entry.field.key, entry])),
    answers,
    language,
  }

  // The value types describe their answers at runtime; the catalog's type names their shapes.
  return describeDocument(document, described) as AnswerDescription<TValueType>
}
