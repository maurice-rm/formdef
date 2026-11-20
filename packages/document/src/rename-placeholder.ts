import { PLACEHOLDER } from './placeholder'

/** A text with every placeholder of one key naming another; braces written as `{{` stay. */
export function renamePlaceholder(
  text: string,
  { from, to }: { from: string; to: string },
): string {
  return text.replace(PLACEHOLDER, (match, key: string | undefined) =>
    key === from ? `{${to}}` : match,
  )
}
