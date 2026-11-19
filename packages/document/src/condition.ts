/**
 * The operators of a condition that compare a field with nothing: whether it holds a value, or
 * whether a boolean field is true or false.
 */
export type PresenceOperator = 'isFilled' | 'isEmpty' | 'isTrue' | 'isFalse'

/**
 * The operators of a condition that compare a field with one value: an option's value, a number,
 * or a date as an ISO string.
 */
export type ValueOperator =
  | 'equals'
  | 'notEquals'
  | 'lessThan'
  | 'atMost'
  | 'greaterThan'
  | 'atLeast'
  | 'before'
  | 'onOrBefore'
  | 'after'
  | 'onOrAfter'
  | 'includes'
  | 'excludes'

/** The operators of a condition that compare a field with a list of option values. */
export type ListOperator = 'in' | 'notIn'

/**
 * A condition of a form document: a comparison of one field, or several conditions combined.
 * Conditions decide whether a step, section, row or field shows, whether a field is required, and
 * which case of a varying setting applies.
 *
 * Which operators fit a field follows from its field kind; a document is checked for that before
 * it is used.
 *
 * @example
 * ```ts
 * const isApartmentBlock: Condition = { field: 'f1', op: 'equals', value: 'o2' }
 * const either: Condition = { any: [isApartmentBlock, { field: 'f4', op: 'atLeast', value: 3 }] }
 * ```
 */
export type Condition =
  | {
      /** The key of the field compared. */
      field: string
      /** How the field is compared. */
      op: PresenceOperator
    }
  | {
      /** The key of the field compared. */
      field: string
      /** How the field is compared. */
      op: ValueOperator
      /** The value compared with: an option's value, a number, or a date as an ISO string. */
      value: string | number
    }
  | {
      /** The key of the field compared. */
      field: string
      /** How the field is compared. */
      op: ListOperator
      /** The option values compared with. */
      value: string[]
    }
  | {
      /** Holds when every one of these conditions holds. */
      all: Condition[]
    }
  | {
      /** Holds when at least one of these conditions holds. */
      any: Condition[]
    }
