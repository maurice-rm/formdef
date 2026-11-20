import { refuseProblems } from '../check/refuse-problems'
import type { Answers } from '../evaluate/answers'
import { evaluate, type ShownField } from '../evaluate/evaluate'
import type { DocumentItem, FormDocument, JsonValue } from '../form-document'
import type { FieldKinds } from '../kinds/create-field-kinds'
import { optionOf } from '../kinds/option-of'
import type { SettingOption } from '../kinds/setting'

/** A filled answer, by the value type of its field kind. */
export type DescribedAnswer =
  | {
      /** Text, a decimal as written, or a date as an ISO string. */
      valueType: 'text' | 'decimal' | 'date'
      /** The answer as entered. */
      value: string
    }
  | {
      /** A number. */
      valueType: 'number'
      /** The number entered. */
      value: number
    }
  | {
      /** A boolean, which is filled only when true. */
      valueType: 'boolean'
      /** Always true. */
      value: true
    }
  | ({
      /** One choice of the field's options. */
      valueType: 'choice'
    } & SettingOption)
  | {
      /** Several choices of the field's options. */
      valueType: 'choices'
      /** The options chosen, in the order of the answer. */
      values: SettingOption[]
    }

/** A field that shows, with its question and its answer. */
export type DescribedField = {
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
  answer: DescribedAnswer | undefined
}

/** A section that shows, with the fields and sections in it that show. */
export type DescribedSection = {
  /** Marks the entry as a section. */
  type: 'section'
  /** The section's title. */
  label: string
  /** What shows in it, in document order; the fields of a row stand one after another. */
  items: DescribedItem[]
}

/** One entry of a description: a field or a section. */
export type DescribedItem = DescribedField | DescribedSection

/** A step that shows, with what shows in it. */
export type DescribedStep = {
  /** The step's key. */
  key: string
  /** The step's name. */
  label: string
  /** What shows in it, in document order. */
  items: DescribedItem[]
}

/** The answers of a document, described: by step in a document with steps, by item without. */
export type AnswerDescription =
  | {
      /** The steps that show, in document order, each with what shows in it. */
      steps: DescribedStep[]
    }
  | {
      /** What shows in a document without steps, in document order. */
      items: DescribedItem[]
    }

type Described = {
  shownByKey: ReadonlyMap<string, ShownField>
  answers: Answers
}

const describeAnswer = (shown: ShownField, answers: Answers): DescribedAnswer | undefined => {
  const answer = answers.get(shown.field.key)
  if (answer === undefined) {
    return undefined
  }
  const { value, valueType } = answer

  switch (valueType) {
    case 'choice': {
      const option = optionOf(shown.field, value)
      return option === undefined ? undefined : { valueType, ...option }
    }
    case 'choices': {
      const options = (value as string[]).map((entry) => optionOf(shown.field, entry))
      const chosen = options.filter((option) => option !== undefined)
      return chosen.length === options.length ? { valueType, values: chosen } : undefined
    }
    case 'number':
      return { valueType, value: value as number }
    case 'boolean':
      return { valueType, value: true }
    default:
      return { valueType, value: value as string }
  }
}

const describeField = (shown: ShownField, answers: Answers): DescribedField => ({
  type: 'field',
  key: shown.field.key,
  label: shown.field.label,
  kind: shown.kind.name,
  settings: shown.settings,
  answer: describeAnswer(shown, answers),
})

const describeItems = (items: readonly DocumentItem[], described: Described): DescribedItem[] =>
  items.flatMap((item): DescribedItem[] => {
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

/**
 * Describes the answers of a form document: each field that shows with its question and its
 * answer, in document order, within the steps and sections that show. A field left empty, or
 * holding a value of the wrong type or no option of the field, has no answer. A server describes
 * the answers the validator returned, such as for an email or a PDF; formatting them, such as a
 * boolean as yes or a decimal with its unit, is the project's.
 *
 * @param document - The document, as {@link readDocument} returns it.
 * @param kinds - The field kinds the document's fields are of.
 * @param values - The answers, nested by step key in a document with steps, flat without.
 * @returns The description; a step or section with nothing that shows is left out.
 * @throws When the document has problems, as {@link checkDocument} reports them.
 *
 * @example
 * ```ts
 * const result = createValidator(document, fieldKinds)['~standard'].validate(values)
 * if (result.issues === undefined) await sendSummary(describeAnswers(document, fieldKinds, result.value))
 * ```
 */
export function describeAnswers(
  document: FormDocument,
  kinds: FieldKinds<unknown>,
  values: unknown,
): AnswerDescription {
  refuseProblems(document, kinds)
  const { shown, answers } = evaluate(document, kinds, values)
  const described = { shownByKey: new Map(shown.map((entry) => [entry.field.key, entry])), answers }

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
