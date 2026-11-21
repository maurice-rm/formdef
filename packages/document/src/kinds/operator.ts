import type { Setting } from './setting'

/**
 * An operator of a value type: how a condition compares a field of that type, and what with.
 *
 * @typeParam TValue - The value of an answer of the value type.
 */
export type Operator<TValue = unknown> = {
  /**
   * What the operator compares with, as a setting a builder renders the input for and
   * `checkDocument` checks the compared value against; `undefined` when it compares with nothing,
   * such as `isFilled`.
   */
  readonly compares?: Setting<unknown>
  /**
   * Whether the comparison holds, given the answer, or `undefined` when the field has none, and
   * the compared value.
   */
  holds(answer: TValue | undefined, compared: unknown): boolean
}
