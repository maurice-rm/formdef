import type { FieldItem } from '../form-document'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import { isOption } from '../kinds/is-option'
import type { Setting, SettingType } from '../kinds/setting'
import type { Text } from '../text'
import type { Answers } from './answers'
import { resolveFormattedText } from './resolve-formatted-text'
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
    ...(description === undefined
      ? {}
      : { description: resolveFormattedText(description, context) }),
  }
}

// `checkDocument` has checked each value against its setting's type before it is resolved.
const resolveTexts = (
  value: JsonValue,
  { type, context }: { type: SettingType | undefined; context: Context },
): JsonValue => {
  if (type === 'text') {
    return resolveVaryingText(value as Text, context)
  }
  if (type === 'options' && Array.isArray(value)) {
    return value.map((option) => resolveOption(option, context))
  }
  return value
}

/**
 * The settings of a field or block for these answers, in a language: a setting that follows an
 * answer takes its case's value, a text setting takes its translation, and the texts of options
 * their case and translation. The description of an option is formatted, so its answers are
 * escaped.
 */
export function resolveSettings(
  owner: Pick<FieldItem, 'settings'>,
  kind: { readonly settings: Readonly<Record<string, Setting<unknown>>> },
  context: Context,
): Readonly<Record<string, JsonValue>> {
  return Object.fromEntries(
    Object.entries(owner.settings ?? {}).map(([name, value]) => {
      const plain = isVarying(value) ? valueFor(value, context.answers) : value
      return [name, resolveTexts(plain, { type: kind.settings[name]?.type, context })]
    }),
  )
}
