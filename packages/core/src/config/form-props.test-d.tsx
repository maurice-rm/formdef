import { createRef } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FormProps, FormPropsFor } from './form-props'

const schema = z.object({ email: z.email(), remember: z.boolean() })
type SignIn = z.input<typeof schema>
type Intent = { intent: 'signIn' | 'signUp' }

type Props = FormProps<typeof schema, Intent>

describe('FormProps', () => {
  it("takes the form's TanStack options again, typed by the data type", () => {
    const props: Props = {
      options: {
        defaultValues: { email: '', remember: false },
        onSubmit: ({ value, meta }) => {
          expectTypeOf(value).toEqualTypeOf<SignIn>()
          expectTypeOf(meta).toEqualTypeOf<Intent>()
        },
      },
    }
    expectTypeOf(props).not.toBeAny()
  })

  it('types the default values by the data type', () => {
    // @ts-expect-error remember is a boolean
    const props: Props = { options: { defaultValues: { email: '', remember: 'yes' } } }
    expectTypeOf(props).not.toBeAny()
  })

  it("leaves the config's own keys to the config", () => {
    // @ts-expect-error the schema belongs to the config
    const props: Props = { options: { schema } }
    expectTypeOf(props).not.toBeAny()
  })

  it('takes what a form element takes, its ref included', () => {
    const props: Props = {
      className: 'grid gap-4',
      id: 'sign-in',
      'aria-label': 'Sign in',
      ref: createRef<HTMLFormElement>(),
    }
    expectTypeOf(props).not.toBeAny()
  })

  it('leaves submitting and the content to the form', () => {
    // @ts-expect-error the form submits through its config
    const submit: Props = { onSubmit: () => undefined }
    // @ts-expect-error the form submits through TanStack, not to a URL
    const action: Props = { action: '/sign-in' }
    // @ts-expect-error the form renders its fields itself
    const children: Props = { children: null }
    // biome-ignore lint/style/useNamingConvention: React names the key of inner HTML.
    const markup = { __html: '' }
    // @ts-expect-error the form renders its fields itself
    const innerHtml: Props = { dangerouslySetInnerHTML: markup }
    expectTypeOf(innerHtml).not.toBeAny()
    expectTypeOf(submit).not.toBeAny()
    expectTypeOf(action).not.toBeAny()
    expectTypeOf(children).not.toBeAny()
  })
})

describe('FormPropsFor', () => {
  it('needs nothing when the config holds the default values', () => {
    expectTypeOf<Record<never, never>>().toExtend<
      FormPropsFor<typeof schema, Intent, { defaultValues: SignIn }>
    >()
  })

  it('needs the default values from the instance when the config leaves them out', () => {
    type Instance = FormPropsFor<typeof schema, Intent, { fields: object }>

    expectTypeOf<Record<never, never>>().not.toExtend<Instance>()
    expectTypeOf<{ options: { onSubmit: () => void } }>().not.toExtend<Instance>()
    expectTypeOf<{ options: { defaultValues: SignIn } }>().toExtend<Instance>()
  })

  it('needs the default values from the instance when the config sets them to undefined', () => {
    type Instance = FormPropsFor<typeof schema, Intent, { defaultValues: undefined }>

    expectTypeOf<Record<never, never>>().not.toExtend<Instance>()
  })
})
