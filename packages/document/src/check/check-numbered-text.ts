import { ENTRY_NUMBER } from '../entry-number'
import { placeholdersOf } from '../placeholders-of'
import type { Text } from '../text'
import { translationsOf } from '../translations-of'
import { checkTranslations } from './check-translations'
import type { CheckWalk } from './check-walk'
import { report } from './report'

/**
 * Checks a text of each entry of a repeat, its title or the label of its remove button, against
 * the document's languages, and reports each placeholder but the entry's number, since such a
 * text names no answers.
 */
export function checkNumberedText(text: Text, at: { walk: CheckWalk; path: string }): void {
  checkTranslations(text, at)
  for (const translation of translationsOf(text, at.path)) {
    for (const field of placeholdersOf(translation.text)) {
      if (field !== ENTRY_NUMBER) {
        report(at.walk, { code: 'fixedText', path: translation.path, params: { field } })
      }
    }
  }
}
