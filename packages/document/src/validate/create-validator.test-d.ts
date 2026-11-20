import type { StandardSchemaV1 } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'

import type { DocumentValues } from '../document-values'
import type { DocumentValidator } from './create-validator'

describe('DocumentValidator', () => {
  it('is a Standard Schema that TanStack Form takes, with the answers as its output', () => {
    expectTypeOf<DocumentValidator>().toExtend<StandardSchemaV1<unknown, DocumentValues>>()
  })
})
