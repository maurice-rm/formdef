import { failAt } from '../fail-at'
import type { ComparesAs } from './compares-as'
import type { Operator } from './operator'
import type { Setting, SettingOption } from './setting'
import type { ValueType } from './value-type'

/** The operators every value type has, which compare whether a field holds an answer. */
type FillOperator = 'isFilled' | 'isEmpty'

/**
 * The operators of a value type, as {@link defineValueType} takes them: by name, each with the
 * setting it compares with and whether the comparison holds.
 *
 * @typeParam TValue - The value of an answer of the value type.
 * @typeParam TCompared - What each operator compares with, by operator name.
 */
export type OperatorDefinitions<TValue, TCompared> = {
  [Name in keyof TCompared]: Name extends FillOperator
    ? never
    : {
        /**
         * What the operator compares with, as a setting, such as `setting.number`; left out when
         * it compares with nothing.
         *
         * @defaultValue nothing
         */
        compares?: Setting<TCompared[Name]>
        /**
         * Whether the comparison holds, given the answer, or `undefined` when the field has none,
         * and the compared value, which `checkDocument` has checked against `compares`.
         */
        holds: (answer: TValue | undefined, compared: NonNullable<TCompared[Name]>) => boolean
      }
}

/**
 * What {@link defineValueType} takes.
 *
 * @typeParam TValue - The value of an answer of this type.
 * @typeParam TName - The value type's name.
 * @typeParam TDescribed - How an answer of this type is described.
 * @typeParam TReadsOptions - Whether an answer chooses among the field's options.
 * @typeParam TCompared - What each operator compares with, by operator name.
 */
export type ValueTypeDefinition<
  TValue,
  TName extends string,
  TDescribed extends object,
  TReadsOptions extends boolean,
  TCompared,
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
  /**
   * Writes an answer as text, given the field's options, for a placeholder `{key}` that names the
   * field.
   *
   * @defaultValue an empty text
   */
  toText?: (value: TValue, options: readonly SettingOption[]) => string
  /**
   * The operators a condition may compare a field of this type with, by name; `isFilled` and
   * `isEmpty` come with every value type.
   *
   * @defaultValue only `isFilled` and `isEmpty`
   */
  operators?: OperatorDefinitions<TValue, TCompared>
  /**
   * How another field is compared with an answer of this type through `valueFrom`, such as a
   * decimal as a `number`; an operator whose `compares` has that setting type accepts it.
   *
   * @defaultValue none; no condition compares with an answer of this type
   */
  comparesAs?: ComparesAs<TValue>
  /**
   * The values of the options an answer chooses, which the validator checks against the field's
   * options and `count` and `score` read; required with `readsOptions`, and only taken with it.
   *
   * @defaultValue none, for a value type that reads no options
   */
  chosenOf?: (value: TValue) => readonly string[]
}

const FILL_OPERATORS: Readonly<Record<FillOperator, Operator>> = {
  isFilled: { holds: (answer) => answer !== undefined },
  isEmpty: { holds: (answer) => answer === undefined },
}

const IS_FILLED = (): boolean => true
const NO_TEXT = (): string => ''
const NO_CHOICES = (): readonly string[] => []

const collectOperators = (
  name: string,
  own: Readonly<Record<string, Operator>>,
): Readonly<Record<string, Operator>> => {
  for (const operator of Object.keys(FILL_OPERATORS)) {
    if (Object.hasOwn(own, operator)) {
      failAt(`${name}.operators.${operator}`, 'every value type has this operator.')
    }
  }
  return { ...own, ...FILL_OPERATORS }
}

/**
 * Defines a value type for form documents: what kind of answer a field gives. A field kind names
 * its value type, which decides how its answers are recognised, when they count as given, how a
 * condition compares them and how they are described. The built-in value types are in every
 * catalog; a project adds its own with {@link createCatalog}.
 *
 * @typeParam TValue - The value of an answer of this type.
 * @typeParam TName - The value type's name.
 * @typeParam TDescribed - How an answer of this type is described.
 * @typeParam TReadsOptions - Whether an answer chooses among the field's options.
 * @typeParam TCompared - What each operator compares with, by operator name.
 * @param definition - The value type.
 * @returns The value type, for field kinds and {@link createCatalog}.
 * @throws When an operator of its own is named `isFilled` or `isEmpty`, which every value type has,
 *   or when it reads options without `chosenOf`.
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
 *   operators: {
 *     inCity: {
 *       compares: setting.text({ label: 'City', required: true }),
 *       holds: (answer, city) => answer?.city === city,
 *     },
 *   },
 * })
 * ```
 */
export function defineValueType<
  TValue,
  const TName extends string,
  TDescribed extends object,
  const TReadsOptions extends boolean = false,
  TCompared = Record<never, never>,
>(
  definition: ValueTypeDefinition<TValue, TName, TDescribed, TReadsOptions, TCompared>,
): ValueType<TValue, TName, TDescribed> & { readonly readsOptions: TReadsOptions } {
  const {
    name,
    emptyValue,
    fits,
    isFilled = IS_FILLED,
    describe,
    toText = NO_TEXT,
    comparesAs,
  } = definition
  const readsOptions = (definition.readsOptions ?? false) as TReadsOptions
  // Each operator's compared value is typed by its own setting; at runtime it is checked data.
  const own = (definition.operators ?? {}) as Readonly<Record<string, Operator>>

  return {
    name,
    emptyValue,
    readsOptions,
    operators: collectOperators(name, own),
    comparesAs,
    fits,
    isFilled,
    chosenOf: chosenOfDefined(definition),
    describe,
    toText,
  }
}

const chosenOfDefined = <TValue>(definition: {
  name: string
  readsOptions?: boolean | undefined
  chosenOf?: ((value: TValue) => readonly string[]) | undefined
}): ((value: TValue) => readonly string[]) => {
  if (definition.readsOptions !== true) {
    return NO_CHOICES
  }
  return (
    definition.chosenOf ??
    failAt(
      `${definition.name}.chosenOf`,
      'a value type that reads options tells which an answer chooses.',
    )
  )
}
