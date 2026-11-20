/**
 * The operators of a condition that compare a field with nothing: whether it holds a value, or
 * whether a boolean field is true or false.
 */
export type PresenceOperator = (typeof PRESENCE_OPERATORS)[number]

/**
 * The operators of a condition that compare a field with one value: an option's value, a number,
 * or a date as an ISO string.
 */
export type ValueOperator = (typeof VALUE_OPERATORS)[number]

/** The operators of a condition that compare a field with a list of option values. */
export type ListOperator = (typeof LIST_OPERATORS)[number]

/** Every operator of a condition. */
export type Operator = PresenceOperator | ValueOperator | ListOperator

export const PRESENCE_OPERATORS: readonly ['isFilled', 'isEmpty', 'isTrue', 'isFalse'] = [
  'isFilled',
  'isEmpty',
  'isTrue',
  'isFalse',
]

export const VALUE_OPERATORS: readonly [
  'equals',
  'notEquals',
  'lessThan',
  'atMost',
  'greaterThan',
  'atLeast',
  'before',
  'onOrBefore',
  'after',
  'onOrAfter',
  'includes',
  'excludes',
] = [
  'equals',
  'notEquals',
  'lessThan',
  'atMost',
  'greaterThan',
  'atLeast',
  'before',
  'onOrBefore',
  'after',
  'onOrAfter',
  'includes',
  'excludes',
]

export const LIST_OPERATORS: readonly ['in', 'notIn'] = ['in', 'notIn']
