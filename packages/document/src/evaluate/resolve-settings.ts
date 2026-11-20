import type { FieldItem, Varying } from '../form-document'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import type { FieldKind } from '../kinds/field-kind'
import { isOption } from '../kinds/is-option'
import type { SettingType } from '../kinds/setting'
import { resolveText } from '../resolve-text'
import type { Answers } from './answers'
import { holds } from './holds'

type Context = { answers: Answers; language: string | undefined }

const valueFor = (varying: Varying, answers: Answers): JsonValue => {
  const applying = varying.cases.find((entry) => holds(entry.when, answers))
  return applying === undefined ? varying.otherwise : applying.value
}

const resolveOption = (option: JsonValue, language: string | undefined): JsonValue => {
  if (!isOption(option)) {
    return option
  }
  const { value, label, description } = option
  return {
    value,
    label: resolveText(label, language),
    ...(description === undefined ? {} : { description: resolveText(description, language) }),
  }
}

// `checkDocument` has checked each value against its setting's type before it is resolved.
const resolveTexts = (
  value: JsonValue,
  { type, language }: { type: SettingType | undefined; language: string | undefined },
): JsonValue => {
  if (type === 'text') {
    return resolveText(value as string, language)
  }
  if (type === 'options' && Array.isArray(value)) {
    return value.map((option) => resolveOption(option, language))
  }
  return value
}

/**
 * A field's settings for these answers, in a language: a setting that follows an answer takes
 * its case's value, and a text setting and the texts of options take their translation.
 */
export function resolveSettings(
  field: FieldItem,
  kind: FieldKind<unknown>,
  { answers, language }: Context,
): Readonly<Record<string, JsonValue>> {
  return Object.fromEntries(
    Object.entries(field.settings ?? {}).map(([name, value]) => {
      const plain = isVarying(value) ? valueFor(value, answers) : value
      return [name, resolveTexts(plain, { type: kind.settings[name]?.type, language })]
    }),
  )
}
