import { describe, expectTypeOf, it } from 'vitest'

import { defineValueType } from './define-value-type'

type Other = { option: string; other: string }

const isOther = (value: unknown): value is Other =>
  typeof value === 'object' && value !== null && 'option' in value && 'other' in value

describe('defineValueType', () => {
  it('gives chosenOf an answer of the value type', () => {
    const withOther = defineValueType({
      name: 'withOther',
      emptyValue: undefined,
      readsOptions: true,
      fits: (value): value is Other => isOther(value),
      chosenOf: (value) => {
        expectTypeOf(value).toEqualTypeOf<Other>()
        return value.option === '' ? [] : [value.option]
      },
      describe: (value) => value,
    })
    expectTypeOf(withOther.chosenOf).toEqualTypeOf<(value: Other) => readonly string[]>()
  })
})
