import type { FieldListeners, FieldValidators } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FieldApiOf } from '../widget/field-of'
import type { FieldEntryOptions } from './field-entry-options'

type Values = {
  email: string
  age: number
  address: { zip: string }
  contacts: { name: string }[]
}

type EmailOptions = FieldEntryOptions<string, Values>

// biome-ignore lint/suspicious/noExplicitAny: the path and error axes a nested config leaves open.
type AnyAxis = any

describe('FieldEntryOptions', () => {
  describe('validators', () => {
    it('validate the value of the field', () => {
      const options: EmailOptions = {
        validators: [
          {
            run: ({ value, fieldApi }) => {
              expectTypeOf(value).toEqualTypeOf<string>()
              expectTypeOf(fieldApi).toExtend<FieldApiOf<string>>()

              return value.includes('@') ? undefined : 'Enter an email address'
            },
            triggers: ['change'],
          },
        ],
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('take a schema for the value of the field', () => {
      expectTypeOf({
        validators: [{ run: z.email(), triggers: ['blur' as const] }],
      }).toExtend<EmailOptions>()

      const options: EmailOptions = {
        // @ts-expect-error the schema checks a number, the field holds a string
        validators: [{ run: z.number(), triggers: ['blur'] }],
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('give async rules an abort signal and a debounce', () => {
      const options: EmailOptions = {
        validators: [
          {
            run: async ({ value, signal }) => {
              expectTypeOf(signal).toEqualTypeOf<AbortSignal>()

              return value === 'taken@example.com' ? 'Already registered' : undefined
            },
            triggers: ['change'],
            triggerDebounceMs: 300,
          },
        ],
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('watch the paths of the whole data type', () => {
      const watching: EmailOptions = {
        validators: [{ run: () => undefined, triggers: ['change'], watchFields: ['age'] }],
      }
      expectTypeOf(watching).not.toBeAny()

      const options: EmailOptions = {
        // @ts-expect-error `agee` is no path of the form
        validators: [{ run: () => undefined, triggers: ['blur'], watchFields: ['agee'] }],
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('reject a trigger TanStack does not have', () => {
      const options: EmailOptions = {
        // @ts-expect-error `chnage` is misspelled
        validators: [{ run: () => undefined, triggers: ['chnage'] }],
      }
      expectTypeOf(options).not.toBeAny()
    })

    it("are TanStack's field validators, typed by the value and the form's values", () => {
      expectTypeOf<EmailOptions['validators']>().toEqualTypeOf<
        FieldValidators<Values, AnyAxis, string> | undefined
      >()
    })
  })

  describe('listeners', () => {
    it('receive the value of the field', () => {
      const options: EmailOptions = {
        listeners: [
          {
            run: ({ value }) => {
              expectTypeOf(value).toEqualTypeOf<string>()
            },
            triggers: ['change'],
          },
        ],
      }
      expectTypeOf(options).not.toBeAny()
    })

    it("are TanStack's field listeners, typed by the value and the form's values", () => {
      expectTypeOf<EmailOptions['listeners']>().toEqualTypeOf<
        FieldListeners<Values, AnyAxis, string, AnyAxis, Values, AnyAxis> | undefined
      >()
    })
  })

  describe('other TanStack field options', () => {
    it("take TanStack's other field options", () => {
      expectTypeOf({ errorBoundary: true }).toExtend<EmailOptions>()

      const options: EmailOptions = {
        errorVisibility: ({ fieldState }) => fieldState.meta.isBlurred,
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('leave the name to the render loop', () => {
      // @ts-expect-error the render loop builds the path
      const options: EmailOptions = { name: 'email' }
      expectTypeOf(options).not.toBeAny()
    })
  })
})
