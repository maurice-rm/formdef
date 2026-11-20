import type { Condition } from '../condition'

/** A key renamed: the key now, and the new one. */
export type Rename = { from: string; to: string }

/** A condition with the key renamed in each comparison, as the field compared or compared with. */
export function renameInCondition(condition: Condition, rename: Rename): Condition {
  if ('all' in condition) {
    return { all: condition.all.map((entry) => renameInCondition(entry, rename)) }
  }
  if ('any' in condition) {
    return { any: condition.any.map((entry) => renameInCondition(entry, rename)) }
  }
  const renamed = (key: string): string => (key === rename.from ? rename.to : key)
  return {
    ...condition,
    field: renamed(condition.field),
    ...(condition.valueFrom === undefined ? {} : { valueFrom: renamed(condition.valueFrom) }),
  }
}
