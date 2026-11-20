import { placeholdersOf } from '../placeholders-of'
import type { Text } from '../text'
import { translationsOf } from '../translations-of'
import { checkTranslations } from './check-translations'
import type { CheckWalk } from './check-walk'
import { report } from './report'

type At = { walk: CheckWalk; path: string }

const checkPlaceholders = (text: string, { walk, path }: At): void => {
  for (const field of placeholdersOf(text)) {
    if (!walk.allFieldKeys.has(field)) {
      report(walk, { code: 'unknownField', path, params: { field } })
    } else if (!walk.earlier.has(field)) {
      report(walk, { code: 'laterField', path, params: { field } })
    }
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
