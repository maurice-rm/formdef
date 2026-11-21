import { isFollowing } from '../is-following'
import { resolveText } from '../resolve-text'
import type { VaryingText } from '../varying-text'
import type { Answers } from './answers'
import { valueFor } from './value-for'

/**
 * The string a text that may follow an answer stands for, before its placeholders are filled:
 * the case that applies for these answers, in the language.
 */
export function chooseText(
  text: VaryingText,
  { answers, language }: { answers: Answers; language: string | undefined },
): string {
  return resolveText(isFollowing(text) ? valueFor(text, answers) : text, language)
}
