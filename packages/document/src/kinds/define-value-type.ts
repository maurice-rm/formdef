import type { SettingOption } from './setting'
import type { ValueType } from './value-type'

/**
 * What {@link defineValueType} takes.
 *
 * @typeParam TValue - The value of an answer of this type.
 * @typeParam TName - The value type's name.
 * @typeParam TDescribed - How an answer of this type is described.
 * @typeParam TReadsOptions - Whether an answer chooses among the field's options.
 */
export type ValueTypeDefinition<
  TValue,
  TName extends string,
  TDescribed extends object,
  TReadsOptions extends boolean,
> = {
  /** The value type's name, unique in a catalog; the built-in value types hold theirs. */
  name: TName
  /** The value a field of this type starts with, which counts as no answer. */
  emptyValue: TValue | undefined
  /**
   * Whether an answer chooses among the options the field's setting `options` lists. A field kind
   * of such a value type needs that setting; the validator refuses an answer that is no option.
   *
   * @defaultValue `false`
   */
  readsOptions?: TReadsOptions
  /** Whether a value has the shape of an answer of this type, such as a value from a request. */
  fits: (value: unknown) => value is TValue
  /**
   * Whether a value of the right shape holds an answer, such as text that is not blank.
   *
   * @defaultValue every value of the right shape is an answer
   */
  isFilled?: (value: TValue) => boolean
  /**
   * Describes an answer, given the field's options; `undefined` leaves the answer out, such as a
   * choice that is no option of the field.
   */
  describe: (value: TValue, options: readonly SettingOption[]) => TDescribed | undefined
}

const IS_FILLED = (): boolean => true

/**
 * Defines a value type for form documents: what kind of answer a field gives. A field kind names
 * its value type, which decides how its answers are recognised, when they count as given and how
 * they are described. The built-in value types are in every catalog; a project adds its own with
 * {@link createCatalog}.
 *
 * @typeParam TValue - The value of an answer of this type.
 * @typeParam TName - The value type's name.
 * @typeParam TDescribed - How an answer of this type is described.
 * @typeParam TReadsOptions - Whether an answer chooses among the field's options.
 * @param definition - The value type.
 * @returns The value type, for field kinds and {@link createCatalog}.
 *
 * @example
 * ```ts
 * type Address = { street: string; city: string }
 *
 * const address = defineValueType({
 *   name: 'address',
 *   emptyValue: { street: '', city: '' },
 *   fits: (value): value is Address => isAddress(value),
 *   isFilled: ({ street, city }) => street.trim() !== '' && city.trim() !== '',
 *   describe: ({ street, city }) => ({ street, city }),
 * })
 * ```
 */
export function defineValueType<
  TValue,
  const TName extends string,
  TDescribed extends object,
  const TReadsOptions extends boolean = false,
>(
  definition: ValueTypeDefinition<TValue, TName, TDescribed, TReadsOptions>,
): ValueType<TValue, TName, TDescribed> & { readonly readsOptions: TReadsOptions } {
  const { name, emptyValue, fits, isFilled = IS_FILLED, describe } = definition
  const readsOptions = (definition.readsOptions ?? false) as TReadsOptions

  return { name, emptyValue, readsOptions, fits, isFilled, describe }
}
