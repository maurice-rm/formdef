import { fillPlaceholders } from './fill-placeholders'
import { resolveText } from './resolve-text'
import type { Text } from './text'

const NO_ANSWER = (): string => ''

/**
 * A text that names no answers, the label of a step or section, in a language, with `{{` and `}}`
 * written as braces.
 */
export function resolveFixedText(text: Text, language: string | undefined): string {
  return fillPlaceholders(resolveText(text, language), NO_ANSWER)
}
