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

// biome-ignore lint/suspicious/noExplicitAny: the open axes of TanStack's validator slots.
type AnyAxis = any
type TanStackValidators = FieldValidators<
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis,
  AnyAxis
>

describe('FieldEntryOptions', () => {
  describe('visibility', () => {
    it('gives visibleWhen the values of the whole form', () => {
      const options: EmailOptions = {
        visibleWhen: (values) => {
          expectTypeOf(values).toEqualTypeOf<Values>()

          return values.age >= 18
        },
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('takes the paths of the whole data type in dependsOn', () => {
      const paths: EmailOptions = { dependsOn: ['age', 'address.zip', 'contacts[0].name'] }
      expectTypeOf(paths).not.toBeAny()

      const shared = ['age', 'address.zip'] as const
      const sharedPaths: EmailOptions = { dependsOn: shared }
      expectTypeOf(sharedPaths).not.toBeAny()

      // @ts-expect-error `adress` is misspelled
      const options: EmailOptions = { dependsOn: ['adress.zip'] }
      expectTypeOf(options).not.toBeAny()
    })
  })

  describe('validators', () => {
    it('validate the value of the field', () => {
      const options: EmailOptions = {
        validators: {
          onChange: ({ value, fieldApi }) => {
            expectTypeOf(value).toEqualTypeOf<string>()
            expectTypeOf(fieldApi).toEqualTypeOf<FieldApiOf<string>>()

            return value.includes('@') ? undefined : 'Enter an email address'
          },
        },
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('take a schema for the value of the field', () => {
      expectTypeOf({ validators: { onBlur: z.email() } }).toExtend<EmailOptions>()

      // @ts-expect-error the schema checks a number, the field holds a string
      const options: EmailOptions = { validators: { onBlur: z.number() } }
      expectTypeOf(options).not.toBeAny()
    })

    it('keep promises out of the sync slots', () => {
      const options: EmailOptions = {
        validators: {
          // @ts-expect-error an async rule belongs in onChangeAsync
          onChange: async ({ value }) => (value === '' ? 'Required' : undefined),
        },
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('give async rules an abort signal', () => {
      const options: EmailOptions = {
        validators: {
          onChangeAsync: async ({ value, signal }) => {
            expectTypeOf(signal).toEqualTypeOf<AbortSignal>()

            return value === 'taken@example.com' ? 'Already registered' : undefined
          },
          onChangeAsyncDebounceMs: 300,
        },
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('take a plain return in an async slot, as TanStack awaits it', () => {
      const options: EmailOptions = {
        validators: { onChangeAsync: ({ value }) => (value === '' ? 'Required' : undefined) },
      }
      expectTypeOf(options).not.toBeAny()
    })

    it('listen to the paths of the whole data type', () => {
      const listening: EmailOptions = { validators: { onChangeListenTo: ['age'] } }
      expectTypeOf(listening).not.toBeAny()

      // @ts-expect-error `agee` is no path of the form
      const options: EmailOptions = { validators: { onBlurListenTo: ['agee'] } }
      expectTypeOf(options).not.toBeAny()
    })

    it('reject a slot TanStack does not have', () => {
      // @ts-expect-error `onChnage` is misspelled
      const options: EmailOptions = { validators: { onChnage: () => undefined } }
      expectTypeOf(options).not.toBeAny()
    })

    it("list exactly TanStack's validator keys", () => {
      expectTypeOf<keyof NonNullable<EmailOptions['validators']>>().toEqualTypeOf<
        keyof TanStackValidators
      >()
    })
  })

  describe('listeners', () => {
    it('receive the value of the field', () => {
      const options: EmailOptions = {
        listeners: {
          onChange: ({ value }) => {
            expectTypeOf(value).toEqualTypeOf<string>()
          },
        },
      }
      expectTypeOf(options).not.toBeAny()
    })

    it("list exactly TanStack's listener keys", () => {
      expectTypeOf<keyof NonNullable<EmailOptions['listeners']>>().toEqualTypeOf<
        keyof FieldListeners<AnyAxis, AnyAxis>
      >()
    })
  })

  describe('other TanStack field options', () => {
    it('type the default value as the value of the field', () => {
      expectTypeOf({ defaultValue: 'you@example.com', asyncAlways: true }).toExtend<EmailOptions>()

      // @ts-expect-error the field holds a string
      const options: EmailOptions = { defaultValue: 42 }
      expectTypeOf(options).not.toBeAny()
    })

    it('leave the name to the render loop', () => {
      // @ts-expect-error the render loop builds the path
      const options: EmailOptions = { name: 'email' }
      expectTypeOf(options).not.toBeAny()
    })
  })
})
