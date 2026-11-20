import { PLACEHOLDER } from './placeholder'

/** The keys a text names in placeholders, `{key}`, in order; `{{` and `}}` name none. */
export function placeholdersOf(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].flatMap(([, key]) => (key === undefined ? [] : [key]))
}
