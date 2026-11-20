import { dayOf } from '../day-of'
import type { JsonValue } from '../json-value'
import { numberOf } from '../number-of'

/**
 * A fixed check of a field kind on a filled value. It carries a code and the parameters an error
 * text needs; the text itself comes from the project. Whether a field is filled at all is checked
 * apart from its rules, through `required`.
 *
 * @typeParam TValue - The values the rule checks.
 */
export type Rule<TValue> = {
  /** Names the check, for the error text: `min`, `maxLength`, `email`, or a code of the project's own. */
  code: string
  /** What the error text names, such as the bound that was missed. */
  params: Record<string, JsonValue>
  /** Whether a filled value passes the check. */
  passes: (value: TValue) => boolean
}

/** What `rule.custom` takes. */
type CustomRule<TValue> = {
  /** Names the check, for the error text. */
  code: string
  /**
   * What the error text names; `label` is reserved for the field's label, which every error text
   * receives.
   *
   * @defaultValue `{}`
   */
  params?: Record<string, JsonValue>
  /** Whether a filled value passes the check. */
  passes: (value: TValue) => boolean
}

/** The rules a field kind builds from its settings. */
type Rules = {
  /** At least `min`, for numbers and decimals; none when `min` is not set. */
  min: (min: number | undefined) => Rule<number | string> | undefined
  /** At most `max`, for numbers and decimals; none when `max` is not set. */
  max: (max: number | undefined) => Rule<number | string> | undefined
  /** A whole number, as a number or as text. */
  integer: () => Rule<number | string>
  /** A decimal written with a comma or a dot, such as `120,5`. */
  decimal: () => Rule<string>
  /** At most `maxLength` characters; none when `maxLength` is not set. */
  maxLength: (maxLength: number | undefined) => Rule<string> | undefined
  /** At least `minCount` choices; none when `minCount` is not set. */
  minCount: (minCount: number | undefined) => Rule<readonly unknown[]> | undefined
  /** At most `maxCount` choices; none when `maxCount` is not set. */
  maxCount: (maxCount: number | undefined) => Rule<readonly unknown[]> | undefined
  /**
   * On or after `earliest`, an ISO date; none when `earliest` is not set. A date with a time is
   * compared by its day.
   */
  earliest: (earliest: string | undefined) => Rule<string> | undefined
  /**
   * On or before `latest`, an ISO date; none when `latest` is not set. A date with a time is
   * compared by its day.
   */
  latest: (latest: string | undefined) => Rule<string> | undefined
  /** The shape of an email address. */
  email: () => Rule<string>
  /**
   * A check of the project's own, such as a national postal code.
   *
   * @typeParam TValue - The values the rule checks.
   */
  custom: <TValue>(rule: CustomRule<TValue>) => Rule<TValue>
}

const DECIMAL = /^-?\d+([.,]\d+)?$/
const INTEGER = /^-?\d+$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const bounded = <TBound, TValue>(
  code: string,
  bound: TBound | undefined,
  passes: (value: TValue, bound: TBound) => boolean,
): Rule<TValue> | undefined =>
  bound === undefined
    ? undefined
    : { code, params: { [code]: bound as JsonValue }, passes: (value) => passes(value, bound) }

/**
 * The rules a field kind builds from its settings, in `rules`. A rule whose bound is not set comes
 * back as `undefined`, so settings pass straight through.
 *
 * @example
 * ```ts
 * rules: ({ min, max }) => [rule.decimal(), rule.min(min), rule.max(max)]
 * ```
 */
export const rule: Rules = {
  min: (min) => bounded('min', min, (value: number | string, bound) => numberOf(value) >= bound),
  max: (max) => bounded('max', max, (value: number | string, bound) => numberOf(value) <= bound),
  integer: () => ({
    code: 'integer',
    params: {},
    passes: (value) => (typeof value === 'number' ? Number.isInteger(value) : INTEGER.test(value)),
  }),
  decimal: () => ({ code: 'decimal', params: {}, passes: (value) => DECIMAL.test(value) }),
  maxLength: (maxLength) =>
    bounded('maxLength', maxLength, (value: string, bound) => value.length <= bound),
  minCount: (minCount) =>
    bounded('minCount', minCount, (value: readonly unknown[], bound) => value.length >= bound),
  maxCount: (maxCount) =>
    bounded('maxCount', maxCount, (value: readonly unknown[], bound) => value.length <= bound),
  earliest: (earliest) =>
    bounded('earliest', earliest, (value: string, bound) => dayOf(value) >= dayOf(bound)),
  latest: (latest) =>
    bounded('latest', latest, (value: string, bound) => dayOf(value) <= dayOf(bound)),
  email: () => ({ code: 'email', params: {}, passes: (value) => EMAIL.test(value) }),
  custom: ({ code, params = {}, passes }) => ({ code, params, passes }),
}
