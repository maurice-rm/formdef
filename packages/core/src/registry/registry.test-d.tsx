import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentType, ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { RowProps, SectionProps } from '../config/structure'
import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'
import type { Registry } from './registry'

const { fieldContext, formContext } = createFormHookContexts()

declare const TextField: ComponentType<FieldOf<string> & { label: string }>
declare const NumberField: ComponentType<FieldOf<number> & { label: string }>
declare const DateField: ComponentType<FieldOf<Date> & { label: string }>
declare const SubmitButton: ComponentType<{ label: string }>

describe('Registry', () => {
  it('carries the widgets, form components and structure slots it was created with', () => {
    const Section = ({ label, children }: SectionProps & { description?: string }): ReactNode => (
      <fieldset aria-label={label}>{children}</fieldset>
    )
    const registry = createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      formComponents: { SubmitButton },
      structure: { section: Section },
    })

    expectTypeOf(registry).toEqualTypeOf<
      Registry<
        { readonly text: typeof TextField },
        { readonly SubmitButton: typeof SubmitButton },
        { readonly section: typeof Section }
      >
    >()
  })

  it('keeps its types through extensions, one after another', () => {
    const base = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })
    const extended = base
      .extendRegistry({ widgets: { number: NumberField } })
      .extendRegistry({ formComponents: { SubmitButton } })
      .extendRegistry({ widgets: { date: DateField } })

    expectTypeOf(extended).not.toBeAny()
    expectTypeOf(extended).toExtend<
      Registry<
        { text: typeof TextField; number: typeof NumberField; date: typeof DateField },
        { SubmitButton: typeof SubmitButton },
        Record<never, never>
      >
    >()
  })

  it('rejects an extension that names a widget the registry already has', () => {
    const base = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })

    // @ts-expect-error a widget named `text` is already registered
    base.extendRegistry({ widgets: { text: NumberField } })
  })

  it('rejects an extension that names a form component the registry already has', () => {
    const base = createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      formComponents: { SubmitButton },
    })

    // @ts-expect-error a form component named `SubmitButton` is already registered
    base.extendRegistry({ formComponents: { SubmitButton } })
  })

  it("hands out TanStack's form hook without its own extension", () => {
    const { formHook } = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })

    expectTypeOf(formHook).toHaveProperty('useAppForm')
    expectTypeOf(formHook).toHaveProperty('withForm')
    expectTypeOf(formHook).toHaveProperty('withFieldGroup')
    expectTypeOf(formHook).not.toHaveProperty('extendForm')
  })

  it('rejects a section slot that takes its label as something other than a string', () => {
    const NumberedSection = ({
      label,
      children,
    }: {
      label: number
      children: ReactNode
    }): ReactNode => <fieldset aria-label={String(label)}>{children}</fieldset>

    createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      // @ts-expect-error the renderer passes the section title as a string
      structure: { section: NumberedSection },
    })
  })

  it('takes slots with props of their own on top of the renderer’s', () => {
    const Row = ({ children, gap }: RowProps & { gap: 'small' | 'large' }): ReactNode => (
      <div data-gap={gap}>{children}</div>
    )

    const registry = createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      structure: { row: Row },
    })
    expectTypeOf(registry).not.toBeAny()
  })
})

describe('Registry.createForm', () => {
  const registry = createRegistry({
    fieldContext,
    formContext,
    widgets: { text: TextField, number: NumberField },
    formComponents: { SubmitButton },
  })
  const schema = z.object({ email: z.email(), age: z.number() })
  type Signup = z.input<typeof schema>
  type Intent = { readonly intent: 'signUp' }

  it('types the callbacks of a config by its schema', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {
        email: {
          widget: 'text',
          props: { label: 'Email' },
          visibleWhen: (values) => {
            expectTypeOf(values).toEqualTypeOf<Signup>()
            return true
          },
        },
        age: { widget: 'number', props: { label: 'Age' } },
      },
      onSubmit: ({ value }) => {
        expectTypeOf(value).toEqualTypeOf<Signup>()
      },
    })
    expectTypeOf(Signup).not.toBeAny()
  })

  it('types the submit meta by onSubmitMeta', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {},
      onSubmitMeta: { intent: 'signUp' },
      onSubmit: ({ meta }) => {
        expectTypeOf(meta).toEqualTypeOf<Intent>()
      },
    })
    expectTypeOf<{ options: { onSubmitMeta: Intent } }>().toExtend<Parameters<typeof Signup>[0]>()
  })

  it('takes a server error from onSubmitAsync', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {},
      validators: {
        onSubmitAsync: async () => ({ form: 'Taken', fields: { email: 'Taken' } }),
      },
    })
    expectTypeOf(Signup).not.toBeAny()
  })

  it('needs no props when the config holds the default values', () => {
    const Signup = registry.createForm({ schema, defaultValues: { email: '', age: 0 }, fields: {} })

    expectTypeOf<Record<never, never>>().toExtend<Parameters<typeof Signup>[0]>()
  })

  it('needs the default values in options when the config leaves them out', () => {
    const Signup = registry.createForm({ schema, fields: {} })

    expectTypeOf<Record<never, never>>().not.toExtend<Parameters<typeof Signup>[0]>()
    expectTypeOf<{ options: { defaultValues: Signup } }>().toExtend<Parameters<typeof Signup>[0]>()
  })

  it('rejects a widget that does not fit its value', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      // @ts-expect-error a number widget does not serve the email
      fields: { email: { widget: 'number', props: { label: 'Email' } } },
    })
  })

  it('rejects a layout naming a key fields does not describe, also in sections and rows', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'text', props: { label: 'Email' } } },
      // @ts-expect-error age is not described in fields
      layout: ['email', 'age'],
    })
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'text', props: { label: 'Email' } } },
      // @ts-expect-error age is not described in fields
      layout: [{ section: 'About you', layout: [{ row: ['email', 'age'] }] }],
    })
  })

  it('takes a layout of described keys and form components', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {
        email: { widget: 'text', props: { label: 'Email' } },
        age: { widget: 'number', props: { label: 'Age' } },
      },
      layout: [
        { section: 'About you', layout: [{ row: ['email', 'age'] }] },
        { component: 'SubmitButton', props: { label: 'Sign up' } },
      ],
    })
    expectTypeOf(Signup).not.toBeAny()
  })
})
