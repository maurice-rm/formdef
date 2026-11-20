import type { FieldItem } from '../form-document'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import type { FieldKind } from '../kinds/field-kind'
import { isOption } from '../kinds/is-option'
import type { SettingType } from '../kinds/setting'
import { resolveText } from '../resolve-text'
import type { Answers } from './answers'
import { resolveVaryingText } from './resolve-varying-text'
import { valueFor } from './value-for'

type Context = { answers: Answers; language: string | undefined }

const resolveOption = (option: JsonValue, context: Context): JsonValue => {
  if (!isOption(option)) {
    return option
  }
  const { value, label, description } = option
  return {
    value,
    label: resolveVaryingText(label, context),
    ...(description === undefined ? {} : { description: resolveVaryingText(description, context) }),
  }
}

// `checkDocument` has checked each value against its setting's type before it is resolved.
const resolveTexts = (
  value: JsonValue,
  { type, context }: { type: SettingType | undefined; context: Context },
): JsonValue => {
  if (type === 'text') {
    return resolveText(value as string, context.language)
  }
  if (type === 'options' && Array.isArray(value)) {
    return value.map((option) => resolveOption(option, context))
  }
  return value
}

/**
 * A field's settings for these answers, in a language: a setting that follows an answer takes
 * its case's value, a text setting takes its translation, and the texts of options their case and
 * translation.
 */
export function resolveSettings(
  field: FieldItem,
  kind: FieldKind<unknown>,
  context: Context,
): Readonly<Record<string, JsonValue>> {
  return Object.fromEntries(
    Object.entries(field.settings ?? {}).map(([name, value]) => {
      const plain = isVarying(value) ? valueFor(value, context.answers) : value
      return [name, resolveTexts(plain, { type: kind.settings[name]?.type, context })]
    }),
  )
}
