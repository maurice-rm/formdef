import { describe, expectTypeOf, it } from 'vitest'

import type { Condition } from './condition'

describe('Condition', () => {
  it('takes any operator, since the operators come from the catalog', () => {
    const own: Condition = { field: 'f1', op: 'startsWith', value: '53' }
    const presence: Condition = { field: 'f1', op: 'isFilled' }
    expectTypeOf(own).toExtend<Condition>()
    expectTypeOf(presence).toExtend<Condition>()
  })

  it('takes a compared value of any JSON', () => {
    const list: Condition = { field: 'f1', op: 'in', value: ['o1', 'o2'] }
    const shape: Condition = { field: 'f1', op: 'near', value: { city: 'Bonn' } }
    expectTypeOf(list).toExtend<Condition>()
    expectTypeOf(shape).toExtend<Condition>()
  })

  it('rejects a compared value that is no JSON', () => {
    // @ts-expect-error a document holds no functions
    const withFunction: Condition = { field: 'f1', op: 'equals', value: () => 'o1' }
    expectTypeOf(withFunction).toExtend<Condition>()
  })
})
