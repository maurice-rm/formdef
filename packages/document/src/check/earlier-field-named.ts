import type { CheckWalk, EarlierField } from './check-walk'
import { report } from './report'

/**
 * The earlier answer a condition, expression or placeholder names by its key, or `undefined` when
 * it may not name it here, after reporting why: the document holds no such field, or it comes
 * later.
 */
export function earlierFieldNamed(
  key: string,
  { walk, path }: { walk: CheckWalk; path: string },
): EarlierField | undefined {
  if (!walk.allFieldKeys.has(key)) {
    report(walk, { code: 'unknownField', path, params: { field: key } })
    return undefined
  }
  const earlier = walk.earlier.get(key)
  if (earlier === undefined) {
    report(walk, { code: 'laterField', path, params: { field: key } })
  }
  return earlier
}
