import type { JsonValue } from './json-value'

/**
 * A condition of a form document: a comparison of one field, or several conditions combined.
 * Conditions decide whether a step, section, row or field shows, whether a field is required, and
 * which case of a varying setting applies.
 *
 * The operators come from the value type of the field compared, and each says what it compares
 * with; {@link checkDocument} checks a document's conditions against its catalog before it is used.
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
      /** The operator of the field's value type that compares it, such as `equals`. */
      op: string
      /**
       * What the field is compared with, as the operator's setting describes it, such as an
       * option's value, a list of them, a number or a date; left out when the operator compares
       * with nothing, such as `isFilled`.
       */
      value?: JsonValue
    }
  | {
      /** Holds when every one of these conditions holds. */
      all: Condition[]
    }
  | {
      /** Holds when at least one of these conditions holds. */
      any: Condition[]
    }

/** A condition that compares one field, rather than combining conditions. */
export type Comparison = Extract<Condition, { field: string }>
