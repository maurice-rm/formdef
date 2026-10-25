import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import * as v from 'valibot'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { InferData } from './infer-data'

describe('InferData', () => {
  it('is the type of the values an object schema accepts', () => {
    const schema = z.object({ email: z.string(), age: z.number() })

    expectTypeOf<InferData<typeof schema>>().toEqualTypeOf<{ email: string; age: number }>()
  })

  it('is the input of a transform, not its output', () => {
    const schema = z.object({ age: z.string().transform(Number) })

    expectTypeOf<InferData<typeof schema>>().toEqualTypeOf<{ age: string }>()
  })

  it('makes a key with a default optional', () => {
    const schema = z.object({ role: z.string().default('user') })

    expectTypeOf<InferData<typeof schema>>().toEqualTypeOf<{ role?: string | undefined }>()
  })

  it('is unknown where a schema coerces its input', () => {
    const schema = z.object({ age: z.coerce.number() })

    expectTypeOf<InferData<typeof schema>>().toEqualTypeOf<{ age: unknown }>()
  })

  it('reads a valibot schema the same way', () => {
    const schema = v.object({
      email: v.string(),
      age: v.pipe(v.string(), v.transform(Number)),
      role: v.optional(v.string(), 'user'),
    })

    expectTypeOf<InferData<typeof schema>>().toEqualTypeOf<{
      email: string
      age: string
      role?: string | undefined
    }>()
  })

  it('is unknown for a schema that does not declare its types', () => {
    type Validate = (value: unknown) => { value: unknown }
    type WithoutTypes = { '~standard': { version: 1; vendor: string; validate: Validate } }
    type WithUndefinedTypes = {
      '~standard': { version: 1; vendor: string; validate: Validate; types: undefined }
    }

    expectTypeOf<InferData<WithoutTypes>>().toBeUnknown()
    expectTypeOf<InferData<WithUndefinedTypes>>().toBeUnknown()
  })

  it('types default values that TanStack accepts next to the schema', () => {
    const { fieldContext, formContext } = createFormHookContexts()
    const { useAppForm } = createFormHook({
      fieldContext,
      formContext,
      fieldComponents: {},
      formComponents: {},
    })
    const schema = z.object({ email: z.email(), age: z.string().transform(Number) })
    const defaultValues: InferData<typeof schema> = { email: '', age: '' }

    const useSignUp = () => useAppForm({ defaultValues, validators: { onChange: schema } })

    expectTypeOf<ReturnType<typeof useSignUp>['state']['values']>().toEqualTypeOf<
      InferData<typeof schema>
    >()
  })

  it('rejects a type that is not a schema', () => {
    // @ts-expect-error a plain object type is no Standard Schema
    expectTypeOf<InferData<{ email: string }>>().toBeObject()
  })
})
