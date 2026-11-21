import type { Text } from './text'

/**
 * A text in a language: the string itself, or its translation, which `checkDocument` makes sure
 * every language of the document has.
 */
export function resolveText(text: Text, language: string | undefined): string {
  if (typeof text === 'string') {
    return text
  }
  return language === undefined ? '' : (text[language] ?? '')
}
