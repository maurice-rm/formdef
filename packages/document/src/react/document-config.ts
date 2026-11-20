import type { Condition } from '../condition'
import { type DocumentValues, nestValues } from '../document-values'
import type { Answers } from '../evaluate/answers'
import { emptyValueOf } from '../evaluate/empty-value-of'
import { evaluate } from '../evaluate/evaluate'
import { holds } from '../evaluate/holds'
import { isRequired } from '../evaluate/is-required'
import { resolveSettings } from '../evaluate/resolve-settings'
import { fieldsOf } from '../fields-of'
import type { DocumentItem, DocumentStep, FieldItem, FormDocument } from '../form-document'
import type { FieldKinds } from '../kinds/create-field-kinds'
import { kindOf } from '../kinds/kind-of'
import type { DocumentValidator } from '../validate/create-validator'

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
  kinds: FieldKinds<unknown>
  answersOf: (values: unknown) => Answers
}

const visibility = (item: { visibleWhen?: Condition }, build: Build): Entry => {
  const condition = item.visibleWhen
  if (condition === undefined) return {}
  return { visibleWhen: (values: unknown) => holds(condition, build.answersOf(values)) }
}

const fieldEntry = (field: FieldItem, build: Build): Entry => {
  const kind = kindOf(build.kinds, field)
  const props = (values: unknown): Entry => {
    const answers = build.answersOf(values)
    return {
      ...kind.props(resolveSettings(field, answers)),
      label: field.label,
      ...(field.hint === undefined ? {} : { description: field.hint }),
      required: isRequired(field, answers),
    }
  }
  return { widget: kind.widget, props, ...visibility(field, build) }
}

const layoutOf = (items: readonly DocumentItem[], build: Build): unknown[] =>
  items.map((item) => {
    if (item.type === 'field') return item.key
    if (item.type === 'row') return { row: layoutOf(item.items, build), ...visibility(item, build) }
    return { section: item.label, layout: layoutOf(item.items, build), ...visibility(item, build) }
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
    value: emptyValueOf(kindOf(build.kinds, field).valueType),
  }))

const stepEntry = (step: DocumentStep, build: Build): Entry => ({
  step: step.key,
  label: step.label,
  ...(step.description === undefined ? {} : { props: { description: step.description } }),
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
 * as the validator reads them.
 */
export const documentConfig = (
  document: FormDocument,
  kinds: FieldKinds<unknown>,
  schema: DocumentValidator,
): DocumentConfig => {
  const build: Build = {
    kinds,
    answersOf: (values) => evaluate(document, kinds, values).answers,
  }
  const parts =
    document.steps === undefined
      ? plainConfig(document.items, build)
      : steppedConfig(document.steps, build)
  return { schema, ...parts }
}
