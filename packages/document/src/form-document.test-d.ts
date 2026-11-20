import { describe, expectTypeOf, it } from 'vitest'

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
