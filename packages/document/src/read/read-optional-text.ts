import type { VaryingText } from '../varying-text'
import { readVaryingText } from './read-varying-text'

export function readOptionalText(value: unknown, path: string): VaryingText | undefined {
  return value === undefined ? undefined : readVaryingText(value, path)
}
