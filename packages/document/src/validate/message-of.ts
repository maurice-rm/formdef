import type { Answers } from '../evaluate/answers'
import { chooseText } from '../evaluate/choose-text'
import { resolveVaryingText } from '../evaluate/resolve-varying-text'
import { fillPlaceholders } from '../fill-placeholders'
import type { FieldItem } from '../form-document'
import type { JsonValue } from '../json-value'
import { FALLBACK_MESSAGE, type Messages } from './messages'

type MessageInput = {
  failure: { code: string; params: Readonly<Record<string, JsonValue>> }
  /** The field the issue is about, or the repeat, which has no texts of its own. */
  item: Pick<FieldItem, 'label' | 'messages'>
  answers: Answers
  language: string | undefined
  messages: Messages
}

/**
 * The text of an issue: the field's own text for its code, its params and label filled in;
 * otherwise the project's or the package's text, given the params and label; otherwise a general
 * one.
 */
export function messageOf({ failure, item, answers, language, messages }: MessageInput): string {
  const label = resolveVaryingText(item.label, { answers, language })
  const params: Readonly<Record<string, JsonValue>> & { label: string } = {
    ...failure.params,
    label,
  }
  const own = item.messages?.[failure.code]
  if (own !== undefined) {
    return fillPlaceholders(chooseText(own, { answers, language }), (name) =>
      Object.hasOwn(params, name) ? String(params[name]) : '',
    )
  }
  return messages[failure.code]?.(params) ?? FALLBACK_MESSAGE
}
