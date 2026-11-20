import type { Condition } from './condition'

/**
 * A calculation of a form document, as data the package evaluates: the answer of an earlier field
 * or computed value, a constant, an operation on expressions, or a choice by conditions, shaped
 * like a setting that follows an answer. An empty operand makes an empty result, unless the
 * operation `otherwise` replaces it.
 *
 * The operations are `add`, `subtract`, `multiply`, `divide`, `min`, `max` and `round` on numbers,
 * and `otherwise`, which takes its second expression when the first is empty;
 * {@link checkDocument} reports any other.
 *
 * @example
 * ```ts
 * const share: Expression = {
 *   op: 'round',
 *   digits: 1,
 *   args: [{ op: 'multiply', args: [{ op: 'divide', args: [{ field: 'f4' }, { field: 'f3' }] }, { value: 100 }] }],
 * }
 * ```
 */
export type Expression =
  | {
      /** The key of an earlier field or computed value whose answer this reads. */
      field: string
    }
  | {
      /** A constant: a number, or a text. */
      value: number | string
    }
  | {
      /** The operation, such as `add`. */
      op: string
      /** What the operation works on, in order. */
      args: Expression[]
      /**
       * For `round`: the digits after the decimal point.
       *
       * @defaultValue `0`
       */
      digits?: number
    }
  | {
      /** The cases, checked in order; the first whose condition holds gives the result. */
      cases: {
        /** The condition under which this case applies. */
        when: Condition
        /** The result in this case. */
        value: Expression
      }[]
      /** The result when no case applies. */
      otherwise: Expression
    }
