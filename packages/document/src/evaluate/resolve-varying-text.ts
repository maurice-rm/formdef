import { fillPlaceholders } from '../fill-placeholders'
import type { VaryingText } from '../varying-text'
import type { Answers } from './answers'
import { chooseText } from './choose-text'

/**
 * A text that may follow an answer and name answers, for these answers and in a language: first
 * the case that applies, then the translation, then the placeholders, each filled with its
 * field's answer as text, or nothing for a field without one.
 */
export function resolveVaryingText(
  text: VaryingText,
  context: { answers: Answers; language: string | undefined },
): string {
  return fillPlaceholders(chooseText(text, context), (key) => context.answers.get(key)?.text ?? '')
}
