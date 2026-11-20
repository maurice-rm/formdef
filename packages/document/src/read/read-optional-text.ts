import type { Text } from '../text'
import { readTranslatableText } from './read-translatable-text'

export function readOptionalText(value: unknown, path: string): Text | undefined {
  return value === undefined ? undefined : readTranslatableText(value, path)
}
