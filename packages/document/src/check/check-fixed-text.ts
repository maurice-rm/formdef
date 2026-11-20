import { placeholdersOf } from '../placeholders-of'
import type { Text } from '../text'
import { translationsOf } from '../translations-of'
import { checkTranslations } from './check-translations'
import type { CheckWalk } from './check-walk'
import { report } from './report'

/**
 * Checks a text the form shows for its whole length, the label of a step or section, against the
 * document's languages, and reports each placeholder, since such a text names no answers.
 */
export function checkFixedText(text: Text, at: { walk: CheckWalk; path: string }): void {
  checkTranslations(text, at)
  for (const translation of translationsOf(text, at.path)) {
    for (const field of placeholdersOf(translation.text)) {
      report(at.walk, { code: 'fixedText', path: translation.path, params: { field } })
    }
  }
}
