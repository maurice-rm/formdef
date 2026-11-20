import { describe, expectTypeOf, it } from 'vitest'

import type { Condition } from './condition'

describe('Condition', () => {
  it('rejects a list operator with a single value', () => {
    // @ts-expect-error `in` compares with a list of option values
    const single: Condition = { field: 'f1', op: 'in', value: 'o1' }
    expectTypeOf(single).toExtend<Condition>()
  })

  it('rejects a presence operator with a value', () => {
    // @ts-expect-error `isFilled` compares with nothing
    const withValue: Condition = { field: 'f1', op: 'isFilled', value: 'x' }
    expectTypeOf(withValue).toExtend<Condition>()
  })
})
