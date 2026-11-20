import { describe, expectTypeOf, it } from 'vitest'

import type { ProblemMessages } from './problem-messages'

describe('ProblemMessages', () => {
  it("gives each code's text its params and the label of the item concerned", () => {
    const messages: ProblemMessages = {
      laterField: (params) => {
        expectTypeOf(params).toEqualTypeOf<Readonly<{ field: string; label: string }>>()
        return `${params.label}: ${params.field} comes later.`
      },
      minAboveMax: ({ min, max }) => `${min} > ${max}`,
    }
    expectTypeOf(messages).not.toBeAny()
  })

  it('rejects a param a code does not have, and a code the package does not report', () => {
    const wrongParam: ProblemMessages = {
      // @ts-expect-error `laterField` names a field, no step
      laterField: ({ step }) => String(step),
    }
    // @ts-expect-error the package reports no code `late`
    const wrongCode: ProblemMessages = { late: () => '' }
    expectTypeOf(wrongParam).not.toBeAny()
    expectTypeOf(wrongCode).not.toBeAny()
  })
})
