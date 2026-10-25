import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentType, ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

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
