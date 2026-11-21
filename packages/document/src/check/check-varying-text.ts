import { isFollowing } from '../is-following'
import { pathTo } from '../path-to'
import type { Text } from '../text'
import type { VaryingText } from '../varying-text'
import { checkCondition } from './check-condition'
import { checkText } from './check-text'
import type { CheckWalk } from './check-walk'

type At = { walk: CheckWalk; path: string }

/**
 * Checks a text that may follow an answer: each case's condition against the fields before it,
 * and each text of the cases and the fallback as `checkPlain` checks a text, by default against
 * the document's languages and with placeholders that name earlier answers.
 */
export function checkVaryingText(
  text: VaryingText,
  { walk, path }: At,
  checkPlain: (plain: Text, at: At) => void = checkText,
): void {
  if (!isFollowing(text)) {
    checkPlain(text, { walk, path })
    return
  }
  text.cases.forEach((entry, index) => {
    checkCondition(entry.when, pathTo.caseWhen(path, index), walk)
    checkPlain(entry.value, { walk, path: pathTo.caseValue(path, index) })
  })
  checkPlain(text.otherwise, { walk, path: pathTo.otherwise(path) })
}
