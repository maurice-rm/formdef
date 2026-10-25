import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FormHandle } from '../config/form-handle'
import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'
import type { FormConfig } from './form-config'

const { fieldContext, formContext } = createFormHookContexts()

declare const TextField: ComponentType<FieldOf<string> & { label: string; required?: boolean }>
declare const CheckboxField: ComponentType<FieldOf<boolean> & { label: string }>
declare const SubmitButton: ComponentType<{ label: string }>

const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField, checkbox: CheckboxField },
  formComponents: { SubmitButton },
})

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  remember: z.boolean(),
})
type SignIn = z.input<typeof schema>
type Intent = { intent: 'signIn' | 'signUp' }

type SignInConfig = FormConfig<typeof registry, typeof schema, Intent>

describe('FormConfig', () => {
  it('describes a whole form typed by its schema', () => {
    const config: SignInConfig = {
      schema,
      defaultValues: { email: '', password: '', remember: false },
      fields: {
        email: { widget: 'text', props: { label: 'Email', required: true } },
        password: { widget: 'text', props: { label: 'Password' } },
        remember: { widget: 'checkbox', props: { label: 'Remember me' } },
      },
      layout: [
        'email',
        'password',
        'remember',
        { component: 'SubmitButton', props: { label: 'Sign in' } },
      ],
      validation: { mode: 'blurThenChange' },
      onSubmitMeta: { intent: 'signIn' },
      onSubmit: ({ value, meta }) => {
        expectTypeOf(value).toEqualTypeOf<SignIn>()
        expectTypeOf(meta).toEqualTypeOf<Intent>()
      },
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('types the default values by the data type', () => {
    const config: SignInConfig = {
      schema,
      // @ts-expect-error remember is a boolean
      defaultValues: { email: '', password: '', remember: 'yes' },
      fields: {},
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('describes only keys of the data type with widgets of the registry', () => {
    const unknownKey: SignInConfig = {
      schema,
      // @ts-expect-error a sign-in has no name
      fields: { name: { widget: 'text', props: { label: 'Name' } } },
    }
    const wrongWidget: SignInConfig = {
      schema,
      // @ts-expect-error a checkbox serves booleans, not the email
      fields: { email: { widget: 'checkbox', props: { label: 'Email' } } },
    }
    expectTypeOf(unknownKey).not.toBeAny()
    expectTypeOf(wrongWidget).not.toBeAny()
  })

  it('hands an inline entry the form handle with the submit meta of the form', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      layout: [
        {
          render: (form) => {
            expectTypeOf(form).toEqualTypeOf<FormHandle<SignIn, Intent>>()
            form.handleSubmit({ intent: 'signUp' })

            return null
          },
        },
      ],
    }
    expectTypeOf(config).not.toBeAny()
  })

  it("takes TanStack's form validators for the whole data type", () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      validators: {
        onChange: ({ value }) => {
          expectTypeOf(value).toEqualTypeOf<SignIn>()

          return value.email === value.password
            ? 'Choose a password that is not your email'
            : undefined
        },
        onSubmitAsync: schema,
      },
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('lets onSubmit read the errors and set one from the server', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      onSubmit: ({ formApi }) => {
        expectTypeOf(formApi.state.errors).not.toEqualTypeOf<never[]>()
        formApi.setErrorMap({ onSubmit: 'The email or the password is wrong.' })
      },
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('starts with a form error in the default state', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      defaultState: { errorMap: { onSubmit: 'The link has expired. Request a new one.' } },
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('takes the start values from defaultValues only', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      // @ts-expect-error the start values belong in defaultValues
      defaultState: { values: { email: '', password: '', remember: false } },
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('rejects a key neither formdef nor TanStack knows', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      // @ts-expect-error neither formdef nor TanStack has `autoSave`
      autoSave: true,
    }
    expectTypeOf(config).not.toBeAny()
  })
})
