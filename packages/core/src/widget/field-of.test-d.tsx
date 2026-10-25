import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'

import type { Compatible, FieldApiOf, FieldOf, ValueOf } from './field-of'

type Label = { label?: string }

const TextWidget = (_: FieldOf<string> & Label) => null
const CheckboxWidget = (_: FieldOf<boolean> & Label) => null
const StatusWidget = (_: FieldOf<'draft' | 'published'>) => null
const DateWidget = (_: FieldOf<Date>) => null
const TagsWidget = (_: FieldOf<string[]>) => null
const ContextWidget = (_: Label) => null
const GenericWidget = <TOption extends string>(_: FieldOf<TOption> & { options: TOption[] }) => null

const widgets = {
  text: TextWidget,
  checkbox: CheckboxWidget,
  status: StatusWidget,
  date: DateWidget,
  tags: TagsWidget,
  context: ContextWidget,
  generic: GenericWidget,
}

type Widgets = typeof widgets

describe('ValueOf', () => {
  it('reads the value type a widget declares through FieldOf', () => {
    expectTypeOf<ValueOf<typeof TextWidget>>().toEqualTypeOf<string>()
    expectTypeOf<ValueOf<typeof StatusWidget>>().toEqualTypeOf<'draft' | 'published'>()
  })

  it('reads unknown from a widget that takes its field from context', () => {
    expectTypeOf<ValueOf<typeof ContextWidget>>().toEqualTypeOf<unknown>()
  })

  it('reads a generic widget as its constraint', () => {
    expectTypeOf<ValueOf<typeof GenericWidget>>().toEqualTypeOf<string>()
  })
})

describe('Compatible', () => {
  it('offers the widgets whose value type accepts the value', () => {
    expectTypeOf<Compatible<Widgets, string>>().toEqualTypeOf<'text' | 'context' | 'generic'>()
    expectTypeOf<Compatible<Widgets, boolean>>().toEqualTypeOf<'checkbox' | 'context'>()
  })

  it('offers the widget of the base type for an optional or nullable value', () => {
    expectTypeOf<Compatible<Widgets, string | undefined>>().toEqualTypeOf<
      'text' | 'context' | 'generic'
    >()
    expectTypeOf<Compatible<Widgets, boolean | null>>().toEqualTypeOf<'checkbox' | 'context'>()
  })

  it('offers a union widget and the wider widgets for a member of the union', () => {
    expectTypeOf<Compatible<Widgets, 'draft'>>().toEqualTypeOf<
      'text' | 'status' | 'context' | 'generic'
    >()
  })

  it('offers only the context widget for a union no single widget serves', () => {
    expectTypeOf<Compatible<Widgets, string | number>>().toEqualTypeOf<'context'>()
  })

  it('offers every widget for a value typed any or never, as TypeScript assigns both everywhere', () => {
    // biome-ignore lint/suspicious/noExplicitAny: pins how a value typed any is matched.
    expectTypeOf<Compatible<Widgets, any>>().toEqualTypeOf<keyof Widgets>()
    expectTypeOf<Compatible<Widgets, never>>().toEqualTypeOf<keyof Widgets>()
  })

  it('offers only the context widget for a value typed unknown', () => {
    expectTypeOf<Compatible<Widgets, unknown>>().toEqualTypeOf<'context'>()
  })

  it('matches platform values and arrays as one value', () => {
    expectTypeOf<Compatible<Widgets, Date>>().toEqualTypeOf<'date' | 'context'>()
    expectTypeOf<Compatible<Widgets, string[]>>().toEqualTypeOf<'tags' | 'context'>()
  })
})

describe('FieldApiOf', () => {
  const { fieldContext, formContext, useFieldContext } = createFormHookContexts()
  const { useAppForm } = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: {},
    formComponents: {},
  })

  it('accepts the field a form renders, at the value type it holds', () => {
    const SignUp = () => {
      const form = useAppForm({ defaultValues: { email: '', age: 0 } })

      return (
        <form.AppField name="email">
          {(field) => {
            expectTypeOf(field).toExtend<FieldApiOf<string>>()
            expectTypeOf(field).not.toExtend<FieldApiOf<number>>()

            return null
          }}
        </form.AppField>
      )
    }

    expectTypeOf(SignUp).toBeFunction()
  })

  it('accepts the field of a form that declares submit metadata', () => {
    const Publish = () => {
      const form = useAppForm({ defaultValues: { title: '' }, onSubmitMeta: { publish: false } })

      return (
        <form.AppField name="title">
          {(field) => {
            expectTypeOf(field).toExtend<FieldApiOf<string>>()

            return null
          }}
        </form.AppField>
      )
    }

    expectTypeOf(Publish).toBeFunction()
  })

  it('accepts a field that the type of the field context rejects', () => {
    type ContextField = ReturnType<typeof useFieldContext<string>>

    const SignUp = () => {
      const form = useAppForm({ defaultValues: { email: '' } })

      return (
        <form.AppField name="email">
          {(field) => {
            expectTypeOf(field).not.toExtend<ContextField>()
            expectTypeOf(field).toExtend<FieldApiOf<string>>()

            return null
          }}
        </form.AppField>
      )
    }

    expectTypeOf(SignUp).toBeFunction()
  })
})
