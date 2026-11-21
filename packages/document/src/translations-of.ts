import type { Text } from './text'

/** The strings of a text, each with where it sits: the string itself, or each translation. */
export function translationsOf(text: Text, path: string): { text: string; path: string }[] {
  if (typeof text === 'string') {
    return [{ text, path }]
  }
  return Object.entries(text).map(([language, translation]) => ({
    text: translation,
    path: `${path}.${language}`,
  }))
}
