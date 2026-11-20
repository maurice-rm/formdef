import { describe, expect, it } from 'vitest'

import { defineValueType } from './define-value-type'
import { setting } from './setting'

type Address = { street: string; city: string }

const isAddress = (value: unknown): value is Address =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Address).street === 'string' &&
  typeof (value as Address).city === 'string'

describe('defineValueType', () => {
  it('keeps what the value type says about its answers', () => {
    const address = defineValueType({
      name: 'address',
      emptyValue: { street: '', city: '' },
      fits: isAddress,
      isFilled: (value) => value.city.trim() !== '',
      describe: (value) => ({ street: value.street, city: value.city }),
    })

    expect(address.name).toBe('address')
    expect(address.emptyValue).toEqual({ street: '', city: '' })
    expect(address.fits({ street: 'Main St', city: 'Bonn' })).toBe(true)
    expect(address.fits('Bonn')).toBe(false)
    expect(address.isFilled({ street: 'Main St', city: ' ' })).toBe(false)
    expect(address.describe({ street: 'Main St', city: 'Bonn' }, [])).toEqual({
      street: 'Main St',
      city: 'Bonn',
    })
    expect(address.readsOptions).toBe(false)
  })

  it('counts every value of the right shape as filled when it says nothing else', () => {
    const rating = defineValueType({
      name: 'rating',
      emptyValue: undefined,
      fits: (value): value is number => Number.isInteger(value),
      describe: (value) => ({ value }),
    })

    expect(rating.isFilled(0)).toBe(true)
  })

  it('holds its operators, each with what it compares with, next to isFilled and isEmpty', () => {
    const compares = setting.text({ label: 'City', required: true })
    const address = defineValueType({
      name: 'address',
      emptyValue: { street: '', city: '' },
      fits: isAddress,
      describe: (value) => ({ city: value.city }),
      operators: {
        inCity: { compares, holds: (answer, city) => answer?.city === city },
      },
    })

    expect(Object.keys(address.operators)).toEqual(['inCity', 'isFilled', 'isEmpty'])
    expect(address.operators.inCity?.compares).toBe(compares)
    expect(address.operators.inCity?.holds({ street: 'Main St', city: 'Bonn' }, 'Bonn')).toBe(true)
    expect(address.operators.isFilled?.compares).toBeUndefined()
    expect(address.operators.isFilled?.holds({ street: '', city: 'Bonn' }, undefined)).toBe(true)
    expect(address.operators.isFilled?.holds(undefined, undefined)).toBe(false)
    expect(address.operators.isEmpty?.holds(undefined, undefined)).toBe(true)
  })

  it('refuses an operator of its own named isFilled or isEmpty', () => {
    expect(() =>
      defineValueType({
        name: 'address',
        emptyValue: undefined,
        fits: isAddress,
        describe: (value) => ({ city: value.city }),
        // @ts-expect-error every value type has isFilled already
        operators: { isFilled: { holds: () => true } },
      }),
    ).toThrow('formdef: address.operators.isFilled: every value type has this operator.')
  })

  it('reads options when it says so', () => {
    const ranking = defineValueType({
      name: 'ranking',
      emptyValue: [],
      readsOptions: true,
      fits: (value): value is string[] => Array.isArray(value),
      describe: (value, options) => ({
        ranked: value.map((entry) => options.find((option) => option.value === entry)),
      }),
    })

    expect(ranking.readsOptions).toBe(true)
    expect(ranking.describe(['o1'], [{ value: 'o1', label: 'First' }])).toEqual({
      ranked: [{ value: 'o1', label: 'First' }],
    })
  })
})
