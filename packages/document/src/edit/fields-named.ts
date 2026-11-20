import type { Condition } from '../condition'

/** The keys of the fields a condition compares, in order and once each. */
export const fieldsNamed = (condition: Condition): string[] => {
  if ('all' in condition) return [...new Set(condition.all.flatMap(fieldsNamed))]
  if ('any' in condition) return [...new Set(condition.any.flatMap(fieldsNamed))]
  return [condition.field]
}
