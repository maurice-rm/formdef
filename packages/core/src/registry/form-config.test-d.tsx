import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FormHandle } from '../config/form-handle'
import type { StepperProps } from '../config/structure'
import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'
import type { FormConfig } from './form-config'

declare const TextField: ComponentType<FieldOf<string> & { label: string; required?: boolean }>
declare const CheckboxField: ComponentType<FieldOf<boolean> & { label: string }>
declare const SubmitButton: ComponentType<{ label: string }>
declare const Stepper: ComponentType<StepperProps & { variant?: 'circles' | 'rail' }>

const registry = createRegistry({
  widgets: { text: TextField, checkbox: CheckboxField },
  formComponents: { SubmitButton },
})

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  remember: z.boolean(),
})
type SignIn = z.input<typeof schema>

type SignInConfig = FormConfig<typeof registry, typeof schema>

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
      onSubmit: ({ value }) => {
        expectTypeOf(value).toEqualTypeOf<SignIn>()
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

  it('hands an inline entry the form handle of the form', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      layout: [
        {
          render: (form) => {
            expectTypeOf(form).toEqualTypeOf<FormHandle<SignIn>>()
            form.handleSubmit()

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
      validators: [
        {
          run: ({ value }) => {
            expectTypeOf(value).toEqualTypeOf<SignIn>()

            return value.email === value.password
              ? 'Choose a password that is not your email'
              : undefined
          },
          triggers: ['change'],
        },
        { run: schema, triggers: [] },
      ],
    }
    expectTypeOf(config).not.toBeAny()
  })

  it('lets onSubmit report an error from the server', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      onSubmit: ({ createValidationError }) =>
        createValidationError('The email or the password is wrong.'),
    }
    expectTypeOf(config).not.toBeAny()
  })

  it("takes the stepper's own props, checked against the registered stepper", () => {
    const stepped = createRegistry({
      widgets: { text: TextField },
      structure: { stepper: Stepper },
    })
    const steps = z.object({ contact: z.object({ email: z.email() }) })
    type SteppedConfig = FormConfig<typeof stepped, typeof steps>

    const config: SteppedConfig = {
      schema: steps,
      fields: { contact: { fields: { email: { widget: 'text', props: { label: 'Email' } } } } },
      layout: [{ step: 'contact', label: 'Contact' }],
      stepper: { props: { variant: 'rail' } },
    }
    const wrong: SteppedConfig = {
      schema: steps,
      fields: { contact: { fields: { email: { widget: 'text', props: { label: 'Email' } } } } },
      layout: [{ step: 'contact', label: 'Contact' }],
      // @ts-expect-error the stepper's variant is 'circles' or 'rail'
      stepper: { props: { variant: 'bar' } },
    }
    stepped.createForm({
      schema: steps,
      defaultValues: { contact: { email: '' } },
      fields: { contact: { fields: { email: { widget: 'text', props: { label: 'Email' } } } } },
      layout: [{ step: 'contact', label: 'Contact' }],
      // @ts-expect-error the stepper has no prop `tone`
      stepper: { props: { tone: 'loud' } },
    })
    expectTypeOf(config).not.toBeAny()
    expectTypeOf(wrong).not.toBeAny()
  })

  it('takes no stepper props without a registered stepper', () => {
    const config: SignInConfig = {
      schema,
      fields: {},
      // @ts-expect-error the registry has no stepper
      stepper: { props: {} },
    }
    const empty: SignInConfig = {
      schema,
      fields: {},
      // @ts-expect-error the registry has no stepper
      stepper: {},
    }
    expectTypeOf(config).not.toBeAny()
    expectTypeOf(empty).not.toBeAny()
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
