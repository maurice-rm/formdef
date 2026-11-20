import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import { valueTypes } from '../kinds/value-types'
import type { Answer, Answers } from './answers'
import { holds } from './holds'

const answers: Answers = new Map<string, Answer>([
  ['house', { value: 'o2', valueType: valueTypes.choice }],
  ['rooms', { value: ['o1', 'o3'], valueType: valueTypes.choices }],
  ['heated', { value: true, valueType: valueTypes.boolean }],
  ['flats', { value: 6, valueType: valueTypes.number }],
  ['area', { value: '120,5', valueType: valueTypes.decimal }],
  ['built', { value: '1978-05-02T10:00', valueType: valueTypes.date }],
])

const holdsOf = (condition: Condition): boolean => holds(condition, answers)

describe('holds', () => {
  it.each<[Condition, boolean]>([
    [{ field: 'house', op: 'isFilled' }, true],
    [{ field: 'missing', op: 'isFilled' }, false],
    [{ field: 'missing', op: 'isEmpty' }, true],
    [{ field: 'heated', op: 'isTrue' }, true],
    [{ field: 'heated', op: 'isFalse' }, false],
    [{ field: 'missing', op: 'isFalse' }, true],
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
    [{ field: 'missing', op: 'excludes', value: 'o3' }, true],
  ])('compares choices: %j is %s', (condition, expected) => {
    expect(holdsOf(condition)).toBe(expected)
  })

  it.each<[Condition, boolean]>([
    [{ field: 'flats', op: 'equals', value: 6 }, true],
    [{ field: 'flats', op: 'lessThan', value: 6 }, false],
    [{ field: 'flats', op: 'atMost', value: 6 }, true],
    [{ field: 'flats', op: 'greaterThan', value: 5 }, true],
    [{ field: 'flats', op: 'atLeast', value: 7 }, false],
    [{ field: 'missing', op: 'lessThan', value: 6 }, false],
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

  it('combines conditions with all and any', () => {
    const isBlock: Condition = { field: 'house', op: 'equals', value: 'o2' }
    const isSmall: Condition = { field: 'flats', op: 'lessThan', value: 3 }

    expect(holdsOf({ all: [isBlock, isSmall] })).toBe(false)
    expect(holdsOf({ any: [isBlock, isSmall] })).toBe(true)
    expect(holdsOf({ all: [] })).toBe(true)
    expect(holdsOf({ any: [] })).toBe(false)
  })
})
