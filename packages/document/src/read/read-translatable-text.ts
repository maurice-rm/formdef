import { failAt } from '../fail-at'
import { isPlainObject } from '../is-plain-object'
import { looksVarying } from '../looks-varying'
import type { Text } from '../text'
import { readLanguageCode } from './read-language-code'
import { readText } from './read-text'

/** Reads a text of a document: a string, or its translations by language code. */
export function readTranslatableText(value: unknown, path: string): Text {
  if (!isPlainObject(value)) {
    return readText(value, path)
  }
  if (looksVarying(value)) {
    failAt(path, 'this text does not follow answers.')
  }
  const translations = Object.entries(value)
  if (translations.length === 0) {
    failAt(path, 'expected text or its translations.')
  }
  return Object.fromEntries(
    translations.map(([language, translation]) => {
      const languagePath = `${path}.${language}`
      return [readLanguageCode(language, languagePath), readText(translation, languagePath)]
    }),
  )
}
