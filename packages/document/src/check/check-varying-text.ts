import { isFollowing } from '../is-following'
import { pathTo } from '../path-to'
import type { VaryingText } from '../varying-text'
import { checkCondition } from './check-condition'
import { checkText } from './check-text'
import type { CheckWalk } from './check-walk'

/**
 * Checks a text that may follow an answer: each case's condition against the fields before it,
 * and each text of the cases and the fallback against the document's languages.
 */
export function checkVaryingText(
  text: VaryingText,
  { walk, path }: { walk: CheckWalk; path: string },
): void {
  if (!isFollowing(text)) {
    checkText(text, { walk, path })
    return
  }
  text.cases.forEach((entry, index) => {
    checkCondition(entry.when, pathTo.caseWhen(path, index), walk)
    checkText(entry.value, { walk, path: `${pathTo.case(path, index)}.value` })
  })
  checkText(text.otherwise, { walk, path: `${path}.otherwise` })
}
