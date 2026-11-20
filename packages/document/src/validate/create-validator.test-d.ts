import type { StandardSchemaV1 } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'

import type { DocumentValues } from '../document-values'
import type { DocumentValidator } from './create-validator'
import type { Messages } from './messages'

describe('DocumentValidator', () => {
  it('is a Standard Schema that TanStack Form takes, with the answers as its output', () => {
    expectTypeOf<DocumentValidator>().toExtend<StandardSchemaV1<unknown, DocumentValues>>()
  })
})

describe('Messages', () => {
  it("types the params of the package's codes, with the field's label", () => {
    const messages: Messages = {
      min: ({ min, label }) => {
        expectTypeOf(min).toEqualTypeOf<number>()
        expectTypeOf(label).toEqualTypeOf<string>()
        return `${label}: at least ${min}`
      },
      earliest: ({ earliest }) => {
        expectTypeOf(earliest).toEqualTypeOf<string>()
        return earliest
      },
      required: ({ label }) => `${label} is required.`,
    }
    expectTypeOf(messages).toExtend<Messages>()
  })

  it("takes a text for a project's own code, with params of any JSON", () => {
    const messages: Messages = { postcode: ({ label }) => `${String(label)} needs five digits.` }
    expectTypeOf(messages).toExtend<Messages>()
  })

  it('rejects a param the code does not have', () => {
    const messages: Messages = {
      // @ts-expect-error `required` has no `min`
      required: ({ min }) => String(min),
    }
    expectTypeOf(messages).toExtend<Messages>()
  })
})
