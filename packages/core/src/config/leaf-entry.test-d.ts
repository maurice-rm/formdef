import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldOf } from '../widget/field-of'
import type { LeafEntry } from './leaf-entry'

type Widgets = {
  text: ComponentType<FieldOf<string> & { label: string; required?: boolean }>
  checkbox: ComponentType<FieldOf<boolean> & { label: string }>
  count: ComponentType<FieldOf<number>>
  fromContext: ComponentType<{ hint?: string }>
  strictText: ComponentType<FieldOf<string> & { label: string; required: boolean }>
}

type Values = { email: string; nickname?: string; agree: boolean; age: number }

type Leaf<TValue> = LeafEntry<Widgets, TValue, Values>

describe('LeafEntry', () => {
  describe('widget', () => {
    it('offers the widgets that serve the value type', () => {
      expectTypeOf<Leaf<string>['widget']>().toEqualTypeOf<'text' | 'fromContext' | 'strictText'>()
      expectTypeOf<Leaf<boolean>['widget']>().toEqualTypeOf<'checkbox' | 'fromContext'>()
    })

    it('rejects a widget that serves another value type', () => {
      // @ts-expect-error a checkbox serves booleans, not strings
      const entry: Leaf<string> = { widget: 'checkbox', props: { label: 'Email' } }
      expectTypeOf(entry).not.toBeAny()
    })

    it('finds the widget of the base type for an optional or nullable field', () => {
      expectTypeOf<Leaf<string | undefined>['widget']>().toEqualTypeOf<
        'text' | 'fromContext' | 'strictText'
      >()
      expectTypeOf<Leaf<string | null>['widget']>().toEqualTypeOf<
        'text' | 'fromContext' | 'strictText'
      >()
    })

    it('offers only a context widget for a field of unknown type', () => {
      expectTypeOf<Leaf<unknown>['widget']>().toEqualTypeOf<'fromContext'>()
    })
  })

  describe('props', () => {
    it('follows the named widget', () => {
      expectTypeOf({ widget: 'text', props: { label: 'Email' } } as const).toExtend<Leaf<string>>()
      expectTypeOf({ widget: 'fromContext', props: { hint: 'Optional' } } as const).toExtend<
        Leaf<string>
      >()
    })

    it('is required when the named widget has a required prop', () => {
      // @ts-expect-error a text field needs its label
      const entry: Leaf<string> = { widget: 'text' }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is forbidden when the named widget takes no props of its own', () => {
      expectTypeOf({ widget: 'count' } as const).toExtend<Leaf<number>>()

      // @ts-expect-error a count field takes no props
      const entry: Leaf<number> = { widget: 'count', props: {} }
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects a prop of another widget', () => {
      // @ts-expect-error `label` belongs to the text widget
      const entry: Leaf<string> = { widget: 'fromContext', props: { label: 'Email' } }
      expectTypeOf(entry).not.toBeAny()
    })

    it('receives the values of the whole form when it is a function', () => {
      const entry: Leaf<string> = {
        widget: 'text',
        props: (values) => {
          expectTypeOf(values).toEqualTypeOf<Values>()

          return { label: values.email }
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('required', () => {
    it('is allowed where the schema requires the field', () => {
      expectTypeOf({ widget: 'text', props: { label: 'Email', required: true } } as const).toExtend<
        Leaf<string>
      >()
    })

    it('is rejected where the schema makes the field optional', () => {
      const entry: Leaf<string | undefined> = {
        widget: 'text',
        // @ts-expect-error the schema does not require this field
        props: { label: 'Nickname', required: true },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is rejected from a props function where the schema makes the field optional', () => {
      const entry: Leaf<string | undefined> = {
        widget: 'text',
        // @ts-expect-error the schema does not require this field
        props: () => ({ label: 'Nickname', required: true }),
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is rejected in every variant of a widget whose props are a union', () => {
      type VariantWidgets = {
        variants: ComponentType<
          FieldOf<string> & ({ mode: 'short'; required?: boolean } | { mode: 'long' })
        >
      }

      const entry: LeafEntry<VariantWidgets, string | undefined, Values> = {
        widget: 'variants',
        // @ts-expect-error the schema does not require this field
        props: { mode: 'short', required: true },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('may be false where the schema makes the field optional', () => {
      expectTypeOf({
        widget: 'text',
        props: { label: 'Nickname', required: false },
      } as const).toExtend<Leaf<string | undefined>>()
    })

    it('stays required as false for a widget that cannot render without it', () => {
      expectTypeOf({
        widget: 'strictText',
        props: { label: 'Nickname', required: false },
      } as const).toExtend<Leaf<string | undefined>>()

      // @ts-expect-error the strict text field needs to know whether it is required
      const entry: Leaf<string | undefined> = { widget: 'strictText', props: { label: 'Nickname' } }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is rejected on an optional path when the widget takes no false for it', () => {
      type TextRequiredWidgets = {
        withMessage: ComponentType<FieldOf<string> & { required?: string }>
      }

      const entry: LeafEntry<TextRequiredWidgets, string | undefined, Values> = {
        widget: 'withMessage',
        // @ts-expect-error this widget's `required` is a message, which `false` is not
        props: { required: false },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('adds nothing to a widget without a required prop', () => {
      // @ts-expect-error a count field takes no props, also on an optional path
      const entry: Leaf<number | undefined> = { widget: 'count', props: {} }
      expectTypeOf(entry).not.toBeAny()
    })
  })
})
