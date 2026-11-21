import type { Condition } from '../condition'

/** The keys of the fields a condition compares or compares with, in order and once each. */
export function fieldsNamed(condition: Condition): string[] {
  if ('all' in condition) {
    return [...new Set(condition.all.flatMap(fieldsNamed))]
  }
  if ('any' in condition) {
    return [...new Set(condition.any.flatMap(fieldsNamed))]
  }
  return condition.valueFrom === undefined || condition.valueFrom === condition.field
    ? [condition.field]
    : [condition.field, condition.valueFrom]
}
