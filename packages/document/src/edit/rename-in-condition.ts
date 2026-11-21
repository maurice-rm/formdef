import type { Condition } from '../condition'
import type { Rename } from './rename'
import { renamedKey } from './renamed-key'

/** A condition with the key renamed in each comparison, as the field compared or compared with. */
export function renameInCondition(condition: Condition, rename: Rename): Condition {
  if ('all' in condition) {
    return { all: condition.all.map((entry) => renameInCondition(entry, rename)) }
  }
  if ('any' in condition) {
    return { any: condition.any.map((entry) => renameInCondition(entry, rename)) }
  }
  return {
    ...condition,
    field: renamedKey(condition.field, rename),
    ...(condition.valueFrom === undefined
      ? {}
      : { valueFrom: renamedKey(condition.valueFrom, rename) }),
  }
}
