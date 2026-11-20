import type { Expression } from '../expression'

/** The keys of the answers an expression reads as operands, in order and once each. */
export function fieldsReadBy(expression: Expression): string[] {
  if ('field' in expression) {
    return [expression.field]
  }
  if ('cases' in expression) {
    const results = [...expression.cases.map((entry) => entry.value), expression.otherwise]
    return [...new Set(results.flatMap(fieldsReadBy))]
  }
  if ('args' in expression) {
    return [...new Set(expression.args.flatMap(fieldsReadBy))]
  }
  return []
}
