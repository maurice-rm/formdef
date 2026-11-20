import type { Condition } from '../condition'
import type { DocumentValues } from '../document-values'
import type { Answers } from '../evaluate/answers'
import { evaluate } from '../evaluate/evaluate'
import { holds } from '../evaluate/holds'
import { isRequired } from '../evaluate/is-required'
import { resolveSettings } from '../evaluate/resolve-settings'
import { resolveVaryingText } from '../evaluate/resolve-varying-text'
import { fieldsOf } from '../fields-of'
import type { DocumentItem, DocumentStep, FieldItem, FormDocument } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import { kindOf } from '../kinds/kind-of'
import type { ValueType } from '../kinds/value-type'
import { nestValues } from '../nest-values'
import { resolveText } from '../resolve-text'
import type { Text } from '../text'
import type { DocumentValidator } from '../validate/create-validator'
import type { VaryingText } from '../varying-text'

type Entry = Readonly<Record<string, unknown>>

/** A form config for a registry's `createForm`, built from a document. */
export type DocumentConfig = {
  schema: DocumentValidator
  defaultValues: DocumentValues
  fields: Record<string, Entry>
  layout: unknown[]
}

type Level = Pick<DocumentConfig, 'fields' | 'layout'>
type Parts = Omit<DocumentConfig, 'schema'>

type Build = {
  catalog: Catalog<unknown, ValueType>
  language: string | undefined
  answersOf: (values: unknown) => Answers
}

const textOf = (text: Text, build: Build): string => resolveText(text, build.language)

const varyingOf = (text: VaryingText, { build, answers }: { build: Build; answers: Answers }) =>
  resolveVaryingText(text, { answers, language: build.language })

// A description that may follow an answer reaches its slot as props of the form's values.
const descriptionProps = (
  { description }: { description?: VaryingText | undefined },
  build: Build,
): Entry =>
  description === undefined
    ? {}
    : {
        props: (values: unknown) => ({
          description: varyingOf(description, { build, answers: build.answersOf(values) }),
        }),
      }

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
    return {
      ...kind.props(resolveSettings(field, kind, { answers, language: build.language })),
      label: varyingOf(field.label, { build, answers }),
      ...(field.description === undefined
        ? {}
        : { description: varyingOf(field.description, { build, answers }) }),
      required: isRequired(field, answers),
    }
  }
  return { widget: kind.widget, props, ...visibility(field, build) }
}

const layoutOf = (items: readonly DocumentItem[], build: Build): unknown[] =>
  items.map((item) => {
    if (item.type === 'field') {
      return item.key
    }
    if (item.type === 'row') {
      return { row: layoutOf(item.items, build), ...visibility(item, build) }
    }
    return {
      section: textOf(item.label, build),
      layout: layoutOf(item.items, build),
      ...descriptionProps(item, build),
      ...visibility(item, build),
    }
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
  ...descriptionProps(step, build),
  ...visibility(step, build),
})

const steppedConfig = (steps: readonly DocumentStep[], build: Build): Parts => ({
  defaultValues: nestValues(
    steps.flatMap((step) => emptyValuesOf(step.items, { build, path: [step.key] })),
  ),
  fields: Object.fromEntries(steps.map((step) => [step.key, levelOf(step.items, build)])),
  layout: steps.map((step) => stepEntry(step, build)),
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
      : steppedConfig(document.steps, build)
  return { schema, ...parts }
}
