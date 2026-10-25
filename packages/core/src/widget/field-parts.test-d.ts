import { describe, expectTypeOf, it } from 'vitest'

import type { FieldParts } from './field-parts'

describe('FieldParts', () => {
  it('leaves the value and its change handler to the widget', () => {
    expectTypeOf<FieldParts['control']>().not.toHaveProperty('value')
    expectTypeOf<FieldParts['control']>().not.toHaveProperty('onChange')
  })

  it('never sets aria-invalid to false', () => {
    expectTypeOf<FieldParts['control']['aria-invalid']>().toEqualTypeOf<true | undefined>()
  })
})
