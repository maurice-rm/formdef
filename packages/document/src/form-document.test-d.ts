import { describe, expectTypeOf, it } from 'vitest'

import type { Condition } from './condition'
import type { FormDocument } from './form-document'

describe('FormDocument', () => {
  it('takes a document with steps and one without', () => {
    expectTypeOf<{ format: 1; steps: [] }>().toExtend<FormDocument>()
    expectTypeOf<{ format: 1; items: [] }>().toExtend<FormDocument>()
  })

  it('rejects a document with both steps and items', () => {
    // @ts-expect-error a document holds either steps or items
    const both: FormDocument = { format: 1, steps: [], items: [] }
    expectTypeOf(both).toExtend<FormDocument>()
  })
})

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
