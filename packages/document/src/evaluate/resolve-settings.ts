import type { FieldItem } from '../form-document'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import { isFormattedText } from '../kinds/is-formatted-text'
import { isOption } from '../kinds/is-option'
import type { Setting } from '../kinds/setting'
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
  const { value, label, description, score } = option
  return {
    value,
    label: resolveVaryingText(label, context),
    ...(description === undefined
      ? {}
      : { description: resolveFormattedText(description, context) }),
    ...(score === undefined ? {} : { score }),
  }
}

// `checkDocument` has checked each value against its setting's type before it is resolved.
const resolveTexts = (
  value: JsonValue,
  { setting, context }: { setting: Setting<unknown> | undefined; context: Context },
): JsonValue => {
  if (setting?.type === 'text') {
    const resolve = isFormattedText(setting) ? resolveFormattedText : resolveVaryingText
    return resolve(value as Text, context)
  }
  if (setting?.type === 'options' && Array.isArray(value)) {
    return value.map((option) => resolveOption(option, context))
  }
  return value
}

/**
 * The settings of a field or block for these answers, in a language: a setting that follows an
 * answer takes its case's value, a text setting takes its translation, and the texts of options
 * their case and translation. A formatted text setting and the description of an option are
 * Markdown, so their answers are escaped.
 */
export function resolveSettings(
  owner: Pick<FieldItem, 'settings'>,
  kind: { readonly settings: Readonly<Record<string, Setting<unknown>>> },
  context: Context,
): Readonly<Record<string, JsonValue>> {
  return Object.fromEntries(
    Object.entries(owner.settings ?? {}).map(([name, value]) => {
      const plain = isVarying(value) ? valueFor(value, context.answers) : value
      return [name, resolveTexts(plain, { setting: kind.settings[name], context })]
    }),
  )
}
