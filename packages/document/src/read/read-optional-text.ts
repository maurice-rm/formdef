import { readText } from './read-text'

export function readOptionalText(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : readText(value, path)
}
