import type { Text } from '../text'
import { checkTranslations } from './check-translations'
import type { CheckWalk } from './check-walk'
import { placeholdersOutside } from './placeholders-outside'
import { report } from './report'

const NO_PLACEHOLDERS: readonly string[] = []

/**
 * Checks a text the form shows for its whole length, the label of a step or section, against the
 * document's languages, and reports each placeholder, since such a text names no answers.
 */
export function checkFixedText(text: Text, at: { walk: CheckWalk; path: string }): void {
  checkTranslations(text, at)
  for (const { placeholder, path } of placeholdersOutside(text, {
    path: at.path,
    allowed: NO_PLACEHOLDERS,
  })) {
    report(at.walk, { code: 'fixedText', path, params: { field: placeholder } })
  }
}
