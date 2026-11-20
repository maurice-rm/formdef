import { PLACEHOLDER } from './placeholder'

const BRACES: Readonly<Record<string, string>> = { '{{': '{', '}}': '}' }

/**
 * A text with each placeholder, `{key}`, filled with the text of its key, and `{{` and `}}`
 * written as braces.
 */
export function fillPlaceholders(text: string, textOf: (key: string) => string): string {
  return text.replace(PLACEHOLDER, (match, key: string | undefined) =>
    key === undefined ? (BRACES[match] ?? match) : textOf(key),
  )
}
