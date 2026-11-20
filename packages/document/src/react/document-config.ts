import type { ReactNode } from 'react'

import type { Condition } from '../condition'
import type { DocumentValues } from '../document-values'
import type { Answers } from '../evaluate/answers'
import { evaluate } from '../evaluate/evaluate'
import { holds } from '../evaluate/holds'
import { isRequired } from '../evaluate/is-required'
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
} from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import { blockKindOf } from '../kinds/block-kind-of'
import type { Catalog } from '../kinds/create-catalog'
import { displayKindOf } from '../kinds/display-kind-of'
import { kindOf } from '../kinds/kind-of'
import type { Setting } from '../kinds/setting'
import type { ValueType } from '../kinds/value-type'
import { nestValues } from '../nest-values'
import { resolveFixedText } from '../resolve-fixed-text'
import type { Text } from '../text'
import type { DocumentValidator } from '../validate/create-validator'
import type { VaryingText } from '../varying-text'
import { formatText, formatTextWithoutLinks } from './format-text'

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
  answersOf: (values: unknown) => Answers
}

const textOf = (text: Text, build: Build): string => resolveFixedText(text, build.language)

const varyingOf = (text: VaryingText, { build, answers }: { build: Build; answers: Answers }) =>
  resolveVaryingText(text, { answers, language: build.language })

const markdownOf = (text: VaryingText, { build, answers }: { build: Build; answers: Answers }) =>
  resolveFormattedText(text, { answers, language: build.language })

const NO_ANSWERS: Answers = { get: () => undefined, valueTypeOf: () => undefined }

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
    props: (values: unknown) => ({
      ...fixed,
      description: format(markdownOf(description, { build, answers: build.answersOf(values) })),
    }),
  }
}

const formatOption = (option: unknown): unknown =>
  isPlainObject(option) && typeof option.description === 'string'
    ? { ...option, description: formatText(option.description) }
    : option

const formatSetting = (value: JsonValue, setting: Setting<unknown> | undefined): unknown => {
  if (setting?.formatted === true && typeof value === 'string') {
    return formatText(value)
  }
  if (setting?.type === 'options' && Array.isArray(value)) {
    return value.map(formatOption)
  }
  return value
}

// The settings are resolved to strings; formatted texts and the descriptions of options render
// formatted.
const withFormattedTexts = (
  settings: Readonly<Record<string, JsonValue>>,
  kind: { readonly settings: Readonly<Record<string, Setting<unknown>>> },
): Readonly<Record<string, unknown>> =>
  Object.fromEntries(
    Object.entries(settings).map(([name, value]) => [
      name,
      formatSetting(value, kind.settings[name]),
    ]),
  )

const visibility = (item: { visibleWhen?: Condition }, build: Build): Entry => {
  const condition = item.visibleWhen
  if (condition === undefined) {
    return {}
  }
  return { visibleWhen: (values: unknown) => holds(condition, build.answersOf(values)) }
}

const fieldEntry = (field: FieldItem, build: Build): Entry => {
  const kind = kindOf(build.catalog, field)
  const props = (values: unknown): Entry => {
    const answers = build.answersOf(values)
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
  const props = (values: unknown): Entry => {
    const answers = build.answersOf(values)
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

const levelOf = (items: readonly DocumentItem[], build: Build): Level => ({
  fields: Object.fromEntries(fieldsOf(items).map((field) => [field.key, fieldEntry(field, build)])),
  layout: layoutOf(items, build),
})

const emptyValuesOf = (
  items: readonly DocumentItem[],
  { build, path }: { build: Build; path: readonly string[] },
): { path: readonly string[]; value: unknown }[] =>
  fieldsOf(items).map((field) => ({
    path: [...path, field.key],
    value: kindOf(build.catalog, field).valueType.emptyValue,
  }))

const stepEntry = (step: DocumentStep, build: Build): Entry => ({
  step: step.key,
  label: textOf(step.label, build),
  ...slotProps(step, build, formatTextWithoutLinks),
  ...visibility(step, build),
})

const stepperOf = (display: Display | undefined, build: Build): Pick<Parts, 'stepper'> => {
  const props = displayPropsOf(display, build)
  return hasProps(props) ? { stepper: { props } } : {}
}

const steppedConfig = (
  { steps, display }: { steps: readonly DocumentStep[]; display?: Display | undefined },
  build: Build,
): Parts => ({
  defaultValues: nestValues(
    steps.flatMap((step) => emptyValuesOf(step.items, { build, path: [step.key] })),
  ),
  fields: Object.fromEntries(steps.map((step) => [step.key, levelOf(step.items, build)])),
  layout: steps.map((step) => stepEntry(step, build)),
  ...stepperOf(display, build),
})

const plainConfig = (items: readonly DocumentItem[], build: Build): Parts => ({
  defaultValues: nestValues(emptyValuesOf(items, { build, path: [] })),
  ...levelOf(items, build),
})

/**
 * Builds the form config of a document: a field entry per field, with its field kind's widget
 * and the props its settings give for the answers, a layout of its rows and sections, steps when
 * it has steps, and each field's empty value as its default. Conditions are read from the answers
 * as the validator reads them. Its texts are in the language given, as {@link languageOf} chose it.
 */
export function documentConfig(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  { schema, language }: { schema: DocumentValidator; language: string | undefined },
): DocumentConfig {
  const build: Build = {
    catalog,
    language,
    answersOf: (values) => evaluate(document, catalog, { values, language }).answers,
  }
  const parts =
    document.steps === undefined
      ? plainConfig(document.items, build)
      : steppedConfig({ steps: document.steps, display: document.display }, build)
  return { schema, ...parts }
}
