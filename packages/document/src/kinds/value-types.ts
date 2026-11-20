import { dayOf } from '../day-of'
import { isIsoDate } from '../is-iso-date'
import { defineValueType } from './define-value-type'
import { optionOf } from './option-of'
import type { SettingOption } from './setting'
import type { ValueType } from './value-type'

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

const text: BuiltIn<string, 'text', Written> = defineValueType({
  name: 'text',
  emptyValue: '',
  fits: isText,
  isFilled: isNotBlank,
  describe: describeText,
})

const choice: BuiltIn<string, 'choice', SettingOption, true> = defineValueType({
  name: 'choice',
  emptyValue: '',
  readsOptions: true,
  fits: isText,
  isFilled: isNotBlank,
  describe: (value, options): SettingOption | undefined => optionOf(options, value),
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
})

const boolean: BuiltIn<boolean, 'boolean', Ticked> = defineValueType({
  name: 'boolean',
  emptyValue: false,
  fits: (value): value is boolean => typeof value === 'boolean',
  isFilled: (value) => value,
  describe: (): Ticked => ({ value: true }),
})

const number: BuiltIn<number, 'number', Counted> = defineValueType({
  name: 'number',
  emptyValue: undefined,
  fits: (value): value is number => typeof value === 'number' && Number.isFinite(value),
  describe: (value): Counted => ({ value }),
})

const decimal: BuiltIn<string, 'decimal', Written> = defineValueType({
  name: 'decimal',
  emptyValue: '',
  fits: isText,
  isFilled: isNotBlank,
  describe: describeText,
})

const date: BuiltIn<string, 'date', Written> = defineValueType({
  name: 'date',
  emptyValue: '',
  fits: isDate,
  isFilled: isNotBlank,
  describe: describeText,
})

/**
 * The built-in value types, part of every catalog: text; one choice of the field's options and
 * several; a boolean, which is filled only when true, so a required consent has to be ticked; a
 * number; a decimal written as text with a comma or a dot, such as `120,5`; and a date as an ISO
 * string, compared by its day. A field kind names one as its `valueType`.
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
