import { placeholdersOf } from '../placeholders-of'
import type { Text } from '../text'
import { translationsOf } from '../translations-of'
import { checkTranslations } from './check-translations'
import type { CheckWalk } from './check-walk'
import { earlierFieldNamed } from './earlier-field-named'

type At = { walk: CheckWalk; path: string }

const checkPlaceholders = (text: string, at: At): void => {
  for (const field of placeholdersOf(text)) {
    earlierFieldNamed(field, at)
  }
}

/**
 * Checks a text against the document's languages, and its placeholders against the fields before
 * it: each names a field that exists and comes earlier.
 */
export function checkText(text: Text, at: At): void {
  checkTranslations(text, at)
  for (const translation of translationsOf(text, at.path)) {
    checkPlaceholders(translation.text, { walk: at.walk, path: translation.path })
  }
}
