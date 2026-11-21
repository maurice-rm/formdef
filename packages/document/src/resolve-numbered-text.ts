import { ENTRY_NUMBER } from './entry-number'
import { fillPlaceholders } from './fill-placeholders'
import { resolveText } from './resolve-text'
import type { Text } from './text'

/**
 * A text of each entry of a repeat, its title or the label of its remove button, in a language,
 * with the entry's number filled in for `{n}`.
 */
export function resolveNumberedText(
  text: Text,
  { language, number }: { language: string | undefined; number: number },
): string {
  return fillPlaceholders(resolveText(text, language), (key) =>
    key === ENTRY_NUMBER ? String(number) : '',
  )
}
