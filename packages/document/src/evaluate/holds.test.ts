import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import { defineValueType } from '../kinds/define-value-type'
import { setting } from '../kinds/setting'
import type { ValueType } from '../kinds/value-type'
import { valueTypes } from '../kinds/value-types'
import type { Answers } from './answers'
import { holds } from './holds'

const postalCode = defineValueType({
  name: 'postalCode',
  emptyValue: '',
  fits: (value): value is string => typeof value === 'string',
  describe: (value) => ({ value }),
  operators: {
    startsWith: {
      compares: setting.text({ label: 'Start', required: true }),
      holds: (answer, start) => answer?.startsWith(start) === true,
    },
  },
})

const VALUE_TYPES = new Map<string, ValueType>([
  ['house', valueTypes.choice],
  ['rooms', valueTypes.choices],
  ['heated', valueTypes.boolean],
  ['flats', valueTypes.number],
  ['area', valueTypes.decimal],
  ['built', valueTypes.date],
  ['postal', postalCode],
  ['missing', valueTypes.choice],
])

const VALUES = new Map<string, unknown>([
  ['house', 'o2'],
  ['rooms', ['o1', 'o3']],
  ['heated', true],
  ['flats', 6],
  ['area', '120,5'],
  ['built', '1978-05-02T10:00'],
  ['postal', '53111'],
])

const answers: Answers = {
  get: (key) => {
    const valueType = VALUE_TYPES.get(key)
    return VALUES.has(key) && valueType !== undefined
      ? { value: VALUES.get(key), valueType, text: '' }
      : undefined
  },
  valueTypeOf: (key) => VALUE_TYPES.get(key),
}

const holdsOf = (condition: Condition): boolean => holds(condition, answers)

describe('holds', () => {
  it.each<[Condition, boolean]>([
    [{ field: 'house', op: 'isFilled' }, true],
    [{ field: 'missing', op: 'isFilled' }, false],
    [{ field: 'missing', op: 'isEmpty' }, true],
    [{ field: 'heated', op: 'isTrue' }, true],
    [{ field: 'heated', op: 'isFalse' }, false],
  ])('compares presence: %j is %s', (condition, expected) => {
    expect(holdsOf(condition)).toBe(expected)
  })

  it.each<[Condition, boolean]>([
    [{ field: 'house', op: 'equals', value: 'o2' }, true],
    [{ field: 'house', op: 'notEquals', value: 'o2' }, false],
    [{ field: 'missing', op: 'notEquals', value: 'o2' }, true],
    [{ field: 'house', op: 'in', value: ['o1', 'o2'] }, true],
    [{ field: 'house', op: 'notIn', value: ['o1'] }, true],
    [{ field: 'missing', op: 'in', value: ['o1'] }, false],
    [{ field: 'rooms', op: 'includes', value: 'o3' }, true],
    [{ field: 'rooms', op: 'excludes', value: 'o3' }, false],
  ])('compares choices: %j is %s', (condition, expected) => {
    expect(holdsOf(condition)).toBe(expected)
  })

  it.each<[Condition, boolean]>([
    [{ field: 'flats', op: 'equals', value: 6 }, true],
    [{ field: 'flats', op: 'lessThan', value: 6 }, false],
    [{ field: 'flats', op: 'atMost', value: 6 }, true],
    [{ field: 'flats', op: 'greaterThan', value: 5 }, true],
    [{ field: 'flats', op: 'atLeast', value: 7 }, false],
    [{ field: 'area', op: 'equals', value: 120.5 }, true],
    [{ field: 'area', op: 'greaterThan', value: 100 }, true],
  ])('compares numbers and decimals: %j is %s', (condition, expected) => {
    expect(holdsOf(condition)).toBe(expected)
  })

  it.each<[Condition, boolean]>([
    [{ field: 'built', op: 'equals', value: '1978-05-02' }, true],
    [{ field: 'built', op: 'before', value: '1978-05-02' }, false],
    [{ field: 'built', op: 'onOrBefore', value: '1978-05-02' }, true],
    [{ field: 'built', op: 'after', value: '1977-12-31' }, true],
    [{ field: 'built', op: 'onOrAfter', value: '1978-05-03' }, false],
  ])('compares dates by their day: %j is %s', (condition, expected) => {
    expect(holdsOf(condition)).toBe(expected)
  })

  it('lets only the negated operators hold for a field without an answer', () => {
    const empty = { get: () => undefined, valueTypeOf: answers.valueTypeOf }
    const holdsEmpty = (condition: Condition): boolean => holds(condition, empty)

    expect(holdsEmpty({ field: 'heated', op: 'isFalse' })).toBe(true)
    expect(holdsEmpty({ field: 'rooms', op: 'excludes', value: 'o3' })).toBe(true)
    expect(holdsEmpty({ field: 'flats', op: 'lessThan', value: 6 })).toBe(false)
    expect(holdsEmpty({ field: 'built', op: 'before', value: '2000-01-01' })).toBe(false)
  })

  it("compares with an operator of a project's value type", () => {
    expect(holdsOf({ field: 'postal', op: 'startsWith', value: '53' })).toBe(true)
    expect(holdsOf({ field: 'postal', op: 'startsWith', value: '10' })).toBe(false)
  })

  it('holds for no operator its value type does not have', () => {
    expect(holdsOf({ field: 'house', op: 'resembles', value: 'o2' })).toBe(false)
    expect(holdsOf({ field: 'house', op: 'toString' })).toBe(false)
    expect(holdsOf({ field: 'unknown', op: 'isEmpty' })).toBe(false)
  })

  it('combines conditions with all and any', () => {
    const isBlock: Condition = { field: 'house', op: 'equals', value: 'o2' }
    const isSmall: Condition = { field: 'flats', op: 'lessThan', value: 3 }

    expect(holdsOf({ all: [isBlock, isSmall] })).toBe(false)
    expect(holdsOf({ any: [isBlock, isSmall] })).toBe(true)
    expect(holdsOf({ all: [] })).toBe(true)
    expect(holdsOf({ any: [] })).toBe(false)
  })
})
