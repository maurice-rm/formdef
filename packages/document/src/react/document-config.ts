import type { EntryPlace } from '@formdef/core'
import type { ReactNode } from 'react'

import type { Condition } from '../condition'
import type { DocumentValues } from '../document-values'
import type { Answers } from '../evaluate/answers'
import { type Evaluation, evaluate } from '../evaluate/evaluate'
import { holds } from '../evaluate/holds'
import { isRequired } from '../evaluate/is-required'
import { NO_ANSWERS } from '../evaluate/no-answers'
import { resolveFormattedText } from '../evaluate/resolve-formatted-text'
import { resolveSettings } from '../evaluate/resolve-settings'
import { resolveVaryingText } from '../evaluate/resolve-varying-text'
import { fieldsOf } from '../fields-of'
import type {
  BlockItem,
  Display,
  DocumentItem,
  DocumentStep,
  FieldItem,
  FormDocument,
  RepeatItem,
} from '../form-document'
import { blockKindOf } from '../kinds/block-kind-of'
import type { Catalog } from '../kinds/create-catalog'
import { displayKindOf } from '../kinds/display-kind-of'
import { kindOf } from '../kinds/kind-of'
import type { ValueType } from '../kinds/value-type'
import { nestValues, type ValuePath } from '../nest-values'
import { repeatsOf } from '../repeats-of'
import { resolveFixedText } from '../resolve-fixed-text'
import { resolveNumberedText } from '../resolve-numbered-text'
import type { Text } from '../text'
import type { DocumentValidator } from '../validate/create-validator'
import type { VaryingText } from '../varying-text'
import { formatText, formatTextWithoutLinks } from './format-text'
import { withFormattedTexts } from './with-formatted-texts'

type Entry = Readonly<Record<string, unknown>>

/** A form config for a registry's `createForm`, built from a document. */
export type DocumentConfig = {
  schema: DocumentValidator
  defaultValues: DocumentValues
  fields: Record<string, Entry>
  layout: unknown[]
  stepper?: { props: Entry }
}

type Level = Pick<DocumentConfig, 'fields' | 'layout'>
type Parts = Omit<DocumentConfig, 'schema'>

type Build = {
  catalog: Catalog<unknown, ValueType>
  language: string | undefined
  /** Where the level's values sit: its step key, or nothing at the root. */
  path: ValuePath
  evaluationOf: (values: unknown) => Evaluation
  /** The answers an entry reads where it renders: inside a repeat, those of its entry. */
  answersOf: (values: unknown, at: EntryPlace) => Answers
}

const textOf = (text: Text, build: Build): string => resolveFixedText(text, build.language)

const varyingOf = (text: VaryingText, { build, answers }: { build: Build; answers: Answers }) =>
  resolveVaryingText(text, { answers, language: build.language })

const markdownOf = (text: VaryingText, { build, answers }: { build: Build; answers: Answers }) =>
  resolveFormattedText(text, { answers, language: build.language })

// A display is fixed for the form: `checkDocument` refuses settings that follow or name an answer.
const displayPropsOf = (display: Display | undefined, build: Build): Entry => {
  if (display === undefined) {
    return {}
  }
  const kind = displayKindOf(build.catalog, display)
  const settings = resolveSettings(display, kind, {
    answers: NO_ANSWERS,
    language: build.language,
  })
  return kind.props(withFormattedTexts(settings, kind))
}

const hasProps = (props: Entry): boolean => Object.keys(props).length > 0

// A description that may follow an answer reaches its slot as props of the form's values, next to
// the props of the slot's display.
const slotProps = (
  { description, display }: { description?: VaryingText | undefined; display?: Display },
  build: Build,
  format: (markdown: string) => ReactNode,
): Entry => {
  const fixed = displayPropsOf(display, build)
  if (description === undefined) {
    return hasProps(fixed) ? { props: fixed } : {}
  }
  return {
    props: (values: unknown, at: EntryPlace) => ({
      ...fixed,
      description: format(markdownOf(description, { build, answers: build.answersOf(values, at) })),
    }),
  }
}

const visibility = (item: { visibleWhen?: Condition }, build: Build): Entry => {
  const condition = item.visibleWhen
  if (condition === undefined) {
    return {}
  }
  return {
    visibleWhen: (values: unknown, at: EntryPlace) => holds(condition, build.answersOf(values, at)),
  }
}

const fieldEntry = (field: FieldItem, build: Build): Entry => {
  const kind = kindOf(build.catalog, field)
  const props = (values: unknown, at: EntryPlace): Entry => {
    const answers = build.answersOf(values, at)
    const settings = resolveSettings(field, kind, { answers, language: build.language })
    return {
      ...kind.props(withFormattedTexts(settings, kind)),
      label: varyingOf(field.label, { build, answers }),
      ...(field.description === undefined
        ? {}
        : { description: formatText(markdownOf(field.description, { build, answers })) }),
      required: isRequired(field, answers),
    }
  }
  return { widget: kind.widget, props, ...visibility(field, build) }
}

const blockEntry = (block: BlockItem, build: Build): Entry => {
  const kind = blockKindOf(build.catalog, block)
  const props = (values: unknown, at: EntryPlace): Entry => {
    const answers = build.answersOf(values, at)
    const settings = resolveSettings(block, kind, { answers, language: build.language })
    return kind.props(withFormattedTexts(settings, kind))
  }
  return { component: kind.component, props, ...visibility(block, build) }
}

const layoutOf = (items: readonly DocumentItem[], build: Build): unknown[] =>
  items.flatMap((item): unknown[] => {
    if (item.type === 'field') {
      return [item.key]
    }
    if (item.type === 'block') {
      return [blockEntry(item, build)]
    }
    if (item.type === 'computed') {
      return []
    }
    if (item.type === 'repeat') {
      return [item.key]
    }
    if (item.type === 'row') {
      return [
        {
          row: layoutOf(item.items, build),
          ...slotProps(item, build, formatText),
          ...visibility(item, build),
        },
      ]
    }
    return [
      {
        section: textOf(item.label, build),
        layout: layoutOf(item.items, build),
        ...slotProps(item, build, formatText),
        ...visibility(item, build),
      },
    ]
  })

const newEntryOf = (repeat: RepeatItem, build: Build): Entry =>
  Object.fromEntries(
    fieldsOf(repeat.items).map((field) => [
      field.key,
      kindOf(build.catalog, field).valueType.emptyValue,
    ]),
  )

// The renderer names an entry's place as `s1.r1[0].f2`; keys hold no dot or bracket, so the
// index after the repeat's path tells the entry.
const entryIndexOf = (place: string, repeatPath: string): number | undefined => {
  const start = `${repeatPath}[`
  return place.startsWith(start) ? Number.parseInt(place.slice(start.length), 10) : undefined
}

const entryAnswersOf = (repeat: RepeatItem, build: Build): Build['answersOf'] => {
  const repeatPath = [...build.path, repeat.key].join('.')
  return (values, at) => {
    const index = entryIndexOf(at.path, repeatPath)
    const shown = build
      .evaluationOf(values)
      .repeats.find((entry) => entry.path.join('.') === repeatPath)
    return (index === undefined ? undefined : shown?.entryAnswers[index]) ?? NO_ANSWERS
  }
}

const numberedTextOf = (text: Text, build: Build) => (index: number) =>
  resolveNumberedText(text, { language: build.language, number: index + 1 })

const frameProps = (repeat: RepeatItem, build: Build): Entry => ({
  ...displayPropsOf(repeat.display, build),
  label: textOf(repeat.label, build),
  ...(repeat.min === undefined ? {} : { min: repeat.min }),
  ...(repeat.max === undefined ? {} : { max: repeat.max }),
  ...(repeat.entryLabel === undefined
    ? {}
    : { itemLabel: numberedTextOf(repeat.entryLabel, build) }),
})

const repeatEntry = (repeat: RepeatItem, build: Build): Entry => ({
  item: levelOf(repeat.items, { ...build, answersOf: entryAnswersOf(repeat, build) }),
  newItem: () => newEntryOf(repeat, build),
  addLabel: textOf(repeat.addLabel, build),
  removeLabel: (_entry: unknown, index: number) => numberedTextOf(repeat.removeLabel, build)(index),
  props: frameProps(repeat, build),
  ...visibility(repeat, build),
})

function levelOf(items: readonly DocumentItem[], build: Build): Level {
  return {
    fields: Object.fromEntries([
      ...fieldsOf(items).map((field) => [field.key, fieldEntry(field, build)]),
      ...repeatsOf(items).map((repeat) => [repeat.key, repeatEntry(repeat, build)]),
    ]),
    layout: layoutOf(items, build),
  }
}

const emptyValuesOf = (
  items: readonly DocumentItem[],
  build: Build,
): { path: ValuePath; value: unknown }[] => [
  ...fieldsOf(items).map((field) => ({
    path: [...build.path, field.key],
    value: kindOf(build.catalog, field).valueType.emptyValue,
  })),
  ...repeatsOf(items).map((repeat) => ({
    path: [...build.path, repeat.key],
    value: Array.from({ length: repeat.min ?? 0 }, () => newEntryOf(repeat, build)),
  })),
]

// A step shows by its condition and the jumps before it, and submits on a jump that ends the form,
// which the evaluation follows.
const stepEntry = (step: DocumentStep, build: Build): Entry => ({
  step: step.key,
  label: textOf(step.label, build),
  ...slotProps(step, build, formatTextWithoutLinks),
  visibleWhen: (values: unknown) => build.evaluationOf(values).shownSteps.has(step.key),
  ...(step.next?.some((jump) => jump.end !== undefined)
    ? { submitsWhen: (values: unknown) => build.evaluationOf(values).end?.step === step.key }
    : {}),
})

const stepperOf = (display: Display | undefined, build: Build): Pick<Parts, 'stepper'> => {
  const props = displayPropsOf(display, build)
  return hasProps(props) ? { stepper: { props } } : {}
}

const steppedConfig = (
  { steps, display }: { steps: readonly DocumentStep[]; display?: Display | undefined },
  build: Build,
): Parts => {
  const stepBuild = (step: DocumentStep): Build => ({ ...build, path: [step.key] })
  return {
    defaultValues: nestValues(steps.flatMap((step) => emptyValuesOf(step.items, stepBuild(step)))),
    fields: Object.fromEntries(
      steps.map((step) => [step.key, levelOf(step.items, stepBuild(step))]),
    ),
    layout: steps.map((step) => stepEntry(step, build)),
    ...stepperOf(display, build),
  }
}

const plainConfig = (items: readonly DocumentItem[], build: Build): Parts => ({
  defaultValues: nestValues(emptyValuesOf(items, build)),
  ...levelOf(items, build),
})

// Every condition and derived prop of a render reads the same values object, which the form
// replaces on each change, so one evaluation per values object serves them all.
const evaluationsOf = (
  document: FormDocument,
  { catalog, language }: Pick<Build, 'catalog' | 'language'>,
): Build['evaluationOf'] => {
  const evaluations = new WeakMap<object, Evaluation>()
  return (values) => {
    if (typeof values !== 'object' || values === null) {
      return evaluate(document, catalog, { values, language })
    }
    const known = evaluations.get(values)
    if (known !== undefined) {
      return known
    }
    const evaluation = evaluate(document, catalog, { values, language })
    evaluations.set(values, evaluation)
    return evaluation
  }
}

/**
 * Builds the form config of a document: a field entry per field, with its field kind's widget
 * and the props its settings give for the answers, a layout of its rows and sections, an array
 * entry per repeat, steps when it has steps, and each field's empty value as its default, a
 * repeat's as many empty entries as its `min`. Conditions are read from the answers as the
 * validator reads them, inside a repeat from those of the entry. Its texts are in the language
 * given, as {@link languageOf} chose it.
 */
export function documentConfig(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  { schema, language }: { schema: DocumentValidator; language: string | undefined },
): DocumentConfig {
  const evaluationOf = evaluationsOf(document, { catalog, language })
  const build: Build = {
    catalog,
    language,
    path: [],
    evaluationOf,
    answersOf: (values) => evaluationOf(values).answers,
  }
  const parts =
    document.steps === undefined
      ? plainConfig(document.items, build)
      : steppedConfig({ steps: document.steps, display: document.display }, build)
  return { schema, ...parts }
}
