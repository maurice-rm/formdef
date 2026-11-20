import type { SettingOption } from './setting'

/**
 * A value type of form documents: what kind of answer a field gives, how a value of that kind is
 * recognised, the value a field starts with, when an answer counts as given and how it is
 * described. Built with {@link defineValueType}; the package ships the built-in ones as
 * {@link valueTypes}.
 *
 * @typeParam TValue - The value of an answer of this type.
 * @typeParam TName - The value type's name.
 * @typeParam TDescribed - How {@link describeAnswers} describes an answer of this type, next to the
 *   value type's name.
 */
export type ValueType<
  TValue = unknown,
  TName extends string = string,
  TDescribed extends object = object,
> = {
  /** The value type's name, unique in a catalog. */
  readonly name: TName
  /** The value a field of this type starts with, which counts as no answer. */
  readonly emptyValue: TValue | undefined
  /** Whether an answer chooses among the options the field's setting `options` lists. */
  readonly readsOptions: boolean
  /** Whether a value has the shape of an answer of this type, such as a value from a request. */
  fits(value: unknown): value is TValue
  /** Whether a value of the right shape holds an answer, such as text that is not blank. */
  isFilled(value: TValue): boolean
  /**
   * Describes an answer, given the field's options; `undefined` leaves the answer out, such as a
   * choice that is no option of the field.
   */
  describe(value: TValue, options: readonly SettingOption[]): TDescribed | undefined
}
