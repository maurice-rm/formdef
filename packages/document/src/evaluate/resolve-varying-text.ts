import { isFollowing } from '../is-following'
import { resolveText } from '../resolve-text'
import type { VaryingText } from '../varying-text'
import type { Answers } from './answers'
import { valueFor } from './value-for'

/**
 * A text that may follow an answer, for these answers and in a language: first the case that
 * applies, then the translation.
 */
export function resolveVaryingText(
  text: VaryingText,
  { answers, language }: { answers: Answers; language: string | undefined },
): string {
  return resolveText(isFollowing(text) ? valueFor(text, answers) : text, language)
}
