import { refuseProblems } from '../check/refuse-problems'
import type { Answers } from '../evaluate/answers'
import { evaluate, type ShownField } from '../evaluate/evaluate'
import type { DocumentItem, FormDocument, JsonValue } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import { optionsOf } from '../kinds/options-of'
import type { ValueType } from '../kinds/value-type'
import type { BuiltInValueType } from '../kinds/value-types'

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

type Described = {
  shownByKey: ReadonlyMap<string, ShownField>
  answers: Answers
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
  const described = valueType.describe(value, optionsOf(shown.field))
  return described === undefined ? undefined : { ...described, valueType: valueType.name }
}

const describeField = (shown: ShownField, answers: Answers): DescribedField<ValueType> => ({
  type: 'field',
  key: shown.field.key,
  label: shown.field.label,
  kind: shown.kind.name,
  settings: shown.settings,
  answer: describeAnswer(shown, answers),
})

const describeItems = (items: readonly DocumentItem[], described: Described): AnyDescribedItem[] =>
  items.flatMap((item): AnyDescribedItem[] => {
    if (item.type === 'field') {
      const shown = described.shownByKey.get(item.key)
      return shown === undefined ? [] : [describeField(shown, described.answers)]
    }
    const inner = describeItems(item.items, described)
    if (item.type === 'row' || inner.length === 0) {
      return inner
    }
    return [{ type: 'section', label: item.label, items: inner }]
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
      return items.length === 0 ? [] : [{ key: step.key, label: step.label, items }]
    }),
  }
}

/**
 * Describes the answers of a form document: each field that shows with its question and its
 * answer, in document order, within the steps and sections that show. Each answer is described by
 * its value type; a field left empty, or holding a value of the wrong type or no option of the
 * field, has no answer. A server describes the answers the validator returned, such as for an
 * email or a PDF; formatting them, such as a boolean as yes or a decimal with its unit, is the
 * project's.
 *
 * @typeParam TValueType - The project's own value types, as its catalog holds them.
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses.
 * @param values - The answers, nested by step key in a document with steps, flat without.
 * @returns The description; a step or section with nothing that shows is left out.
 * @throws When the document has problems, as {@link checkDocument} reports them.
 *
 * @example
 * ```ts
 * const result = createValidator(document, catalog)['~standard'].validate(values)
 * if (result.issues === undefined) await sendSummary(describeAnswers(document, catalog, result.value))
 * ```
 */
export function describeAnswers<TValueType extends ValueType = never>(
  document: FormDocument,
  catalog: Catalog<unknown, TValueType>,
  values: unknown,
): AnswerDescription<TValueType> {
  refuseProblems(document, catalog)
  const { shown, answers } = evaluate(document, catalog, values)
  const described = { shownByKey: new Map(shown.map((entry) => [entry.field.key, entry])), answers }

  // The value types describe their answers at runtime; the catalog's type names their shapes.
  return describeDocument(document, described) as AnswerDescription<TValueType>
}
