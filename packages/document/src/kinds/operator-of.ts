import type { Operator } from './operator'
import type { ValueType } from './value-type'

/**
 * The operator of this name of a value type, or `undefined` when it has none; names such as
 * `constructor` are no operators.
 */
export function operatorOf(valueType: ValueType, op: string): Operator | undefined {
  return Object.hasOwn(valueType.operators, op) ? valueType.operators[op] : undefined
}
