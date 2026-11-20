import { fillPlaceholders } from '../fill-placeholders'
import { isFollowing } from '../is-following'
import { resolveText } from '../resolve-text'
import type { VaryingText } from '../varying-text'
import type { Answers } from './answers'
import { valueFor } from './value-for'

/**
 * A text that may follow an answer and name answers, for these answers and in a language: first
 * the case that applies, then the translation, then the placeholders, each filled with its
 * field's answer as text, or nothing for a field without one.
 */
export function resolveVaryingText(
  text: VaryingText,
  { answers, language }: { answers: Answers; language: string | undefined },
): string {
  const translated = resolveText(isFollowing(text) ? valueFor(text, answers) : text, language)
  return fillPlaceholders(translated, (key) => answers.get(key)?.text ?? '')
}
