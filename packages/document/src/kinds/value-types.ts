import { dayOf } from '../day-of'
import { isIsoDate } from '../is-iso-date'
import { numberOf } from '../number-of'
import { defineValueType } from './define-value-type'
import { optionOf } from './option-of'
import { type Setting, type SettingOption, setting } from './setting'
import type { ValueType } from './value-type'

type Comparable = number | string
type Order = (answer: Comparable, compared: Comparable) => boolean

type BuiltIn<
  TValue,
  TName extends string,
  TDescribed extends object,
  TReadsOptions extends boolean = false,
> = ValueType<TValue, TName, TDescribed> & { readonly readsOptions: TReadsOptions }

type Written = {
  /** The answer as entered: text, a decimal as written, or a date as an ISO string. */
  value: string
}

type Counted = {
  /** The number entered. */
  value: number
}

type Ticked = {
  /** Always true: a boolean that is not true has no answer. */
  value: true
}

type Chosen = {
  /** The options chosen, in the order of the answer. */
  values: SettingOption[]
}

/** One of the built-in value types, which every catalog holds. */
export type BuiltInValueType = (typeof valueTypes)[keyof typeof valueTypes]

const LIST_SEPARATOR = ', '

// An ISO time after the day: hours and minutes, optional seconds and fraction, optional offset.
const ISO_TIME = /^T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/

const isText = (value: unknown): value is string => typeof value === 'string'

const isDate = (value: unknown): value is string => {
  if (!isText(value)) {
    return false
  }
  const time = value.slice(dayOf(value).length)
  return isIsoDate(dayOf(value)) && (time === '' || ISO_TIME.test(time))
}

const isNotBlank = (value: string): boolean => value.trim() !== ''

const describeText = (value: string): Written => ({ value })

const OPTION = setting.option({ label: 'Option', required: true })
const OPTION_LIST = setting.optionList({ label: 'Options', required: true })
const NUMBER = setting.number({ label: 'Number', required: true })
const DATE = setting.date({ label: 'Date', required: true })

const isSame: Order = (answer, compared) => answer === compared
const isLess: Order = (answer, compared) => answer < compared
const isAtMost: Order = (answer, compared) => answer <= compared
const isGreater: Order = (answer, compared) => answer > compared
const isAtLeast: Order = (answer, compared) => answer >= compared

const negated = <TAnswer, TCompared>(operator: {
  compares?: Setting<TCompared>
  holds: (answer: TAnswer | undefined, compared: TCompared) => boolean
}) => ({
  ...operator,
  holds: (answer: TAnswer | undefined, compared: TCompared): boolean =>
    !operator.holds(answer, compared),
})

// An empty field equals nothing and comes in no order, so only the negated operators hold for it.
const orderedBy =
  <TAnswer extends Comparable, TCompared extends Comparable>(
    comparableOf: (value: Comparable) => Comparable,
    compares: Setting<TCompared>,
  ) =>
  (order: Order) => ({
    compares,
    holds: (answer: TAnswer | undefined, compared: TCompared): boolean =>
      answer !== undefined && order(comparableOf(answer), comparableOf(compared)),
  })

const numericOperators = <TAnswer extends Comparable>(
  comparableOf: (value: Comparable) => Comparable,
) => {
  const by = orderedBy<TAnswer, number>(comparableOf, NUMBER)
  const equals = by(isSame)
  return {
    equals,
    notEquals: negated(equals),
    lessThan: by(isLess),
    atMost: by(isAtMost),
    greaterThan: by(isGreater),
    atLeast: by(isAtLeast),
  }
}

const byDay = orderedBy<string, string>((value) => dayOf(String(value)), DATE)

const isChosen = {
  compares: OPTION,
  holds: (answer: string | undefined, compared: string): boolean => answer === compared,
}

const isAmong = {
  compares: OPTION_LIST,
  holds: (answer: string | undefined, compared: string[]): boolean =>
    answer !== undefined && compared.includes(answer),
}

const includesOption = {
  compares: OPTION,
  holds: (answer: readonly string[] | undefined, compared: string): boolean =>
    answer?.includes(compared) === true,
}

const asWritten = (value: string): string => value

const labelOf = (options: readonly SettingOption[], value: string): string =>
  optionOf(options, value)?.label ?? ''

const text: BuiltIn<string, 'text', Written> = defineValueType({
  name: 'text',
  emptyValue: '',
  fits: isText,
  isFilled: isNotBlank,
  describe: describeText,
  toText: asWritten,
  comparesAs: { type: 'text', of: asWritten },
})

const choice: BuiltIn<string, 'choice', SettingOption, true> = defineValueType({
  name: 'choice',
  emptyValue: '',
  readsOptions: true,
  fits: isText,
  isFilled: isNotBlank,
  describe: (value, options): SettingOption | undefined => optionOf(options, value),
  toText: (value, options) => labelOf(options, value),
  operators: {
    equals: isChosen,
    notEquals: negated(isChosen),
    in: isAmong,
    notIn: negated(isAmong),
  },
  comparesAs: { type: 'option', of: asWritten },
})

const choices: BuiltIn<readonly string[], 'choices', Chosen, true> = defineValueType({
  name: 'choices',
  emptyValue: [],
  readsOptions: true,
  fits: (value): value is readonly string[] => Array.isArray(value) && value.every(isText),
  isFilled: (value) => value.length > 0,
  describe: (value, options): Chosen | undefined => {
    const chosen = value.map((entry) => optionOf(options, entry))
    const known = chosen.filter((option) => option !== undefined)
    return known.length === chosen.length ? { values: known } : undefined
  },
  toText: (value, options) =>
    value
      .map((entry) => labelOf(options, entry))
      .filter((label) => label !== '')
      .join(LIST_SEPARATOR),
  operators: { includes: includesOption, excludes: negated(includesOption) },
  comparesAs: { type: 'optionList', of: (value) => [...value] },
})

const boolean: BuiltIn<boolean, 'boolean', Ticked> = defineValueType({
  name: 'boolean',
  emptyValue: false,
  fits: (value): value is boolean => typeof value === 'boolean',
  isFilled: (value) => value,
  describe: (): Ticked => ({ value: true }),
  operators: {
    isTrue: { holds: (answer) => answer === true },
    isFalse: { holds: (answer) => answer !== true },
  },
  comparesAs: { type: 'boolean', of: (value) => value },
})

const number: BuiltIn<number, 'number', Counted> = defineValueType({
  name: 'number',
  emptyValue: undefined,
  fits: (value): value is number => typeof value === 'number' && Number.isFinite(value),
  describe: (value): Counted => ({ value }),
  toText: String,
  operators: numericOperators<number>((value) => value),
  comparesAs: { type: 'number', of: (value) => value },
})

const decimal: BuiltIn<string, 'decimal', Written> = defineValueType({
  name: 'decimal',
  emptyValue: '',
  fits: isText,
  isFilled: isNotBlank,
  describe: describeText,
  toText: asWritten,
  operators: numericOperators<string>(numberOf),
  comparesAs: { type: 'number', of: numberOf },
})

const date: BuiltIn<string, 'date', Written> = defineValueType({
  name: 'date',
  emptyValue: '',
  fits: isDate,
  isFilled: isNotBlank,
  describe: describeText,
  toText: asWritten,
  operators: {
    equals: byDay(isSame),
    before: byDay(isLess),
    onOrBefore: byDay(isAtMost),
    after: byDay(isGreater),
    onOrAfter: byDay(isAtLeast),
  },
  comparesAs: { type: 'date', of: asWritten },
})

/**
 * The built-in value types, part of every catalog: text; one choice of the field's options and
 * several; a boolean, which is filled only when true, so a required consent has to be ticked; a
 * number; a decimal written as text with a comma or a dot, such as `120,5`; and a date as an ISO
 * string, compared by its day. A field kind names one as its `valueType`. A condition may compare
 * a field with the answer of another through `valueFrom`: a decimal compares as a number, each other
 * type as its own setting type.
 *
 * @example
 * ```ts
 * const measure = defineFieldKind(registry, {
 *   name: 'measure',
 *   label: 'Measure with unit',
 *   widget: 'text',
 *   valueType: valueTypes.decimal,
 * })
 * ```
 */
export const valueTypes: {
  readonly text: typeof text
  readonly choice: typeof choice
  readonly choices: typeof choices
  readonly boolean: typeof boolean
  readonly number: typeof number
  readonly decimal: typeof decimal
  readonly date: typeof date
} = { text, choice, choices, boolean, number, decimal, date }
