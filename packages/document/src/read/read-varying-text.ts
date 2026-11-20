import { looksVarying } from '../looks-varying'
import type { VaryingText } from '../varying-text'
import { readTranslatableText } from './read-translatable-text'
import { readVarying } from './read-varying'

/** Reads a text that may follow an answer: a text, or `{ cases, otherwise }` of texts. */
export function readVaryingText(value: unknown, path: string): VaryingText {
  return looksVarying(value)
    ? readVarying(value, path, readTranslatableText)
    : readTranslatableText(value, path)
}
