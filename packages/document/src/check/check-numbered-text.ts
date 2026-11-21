import { ENTRY_NUMBER } from '../entry-number'
import type { Text } from '../text'
import { checkTranslations } from './check-translations'
import type { CheckWalk } from './check-walk'
import { placeholdersOutside } from './placeholders-outside'
import { report } from './report'

const ENTRY_NUMBER_ONLY: readonly string[] = [ENTRY_NUMBER]

/**
 * Checks a text of each entry of a repeat, its title or the label of its remove button, against
 * the document's languages, and reports each placeholder but the entry's number, since such a
 * text names no answers.
 */
export function checkNumberedText(text: Text, at: { walk: CheckWalk; path: string }): void {
  checkTranslations(text, at)
  for (const { placeholder, path } of placeholdersOutside(text, {
    path: at.path,
    allowed: ENTRY_NUMBER_ONLY,
  })) {
    report(at.walk, { code: 'fixedText', path, params: { key: placeholder } })
  }
}
