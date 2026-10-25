import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldOf } from '../widget/field-of'
import type { ExtraProps } from './extra-props'
import type { PropsEntry } from './props-entry'

type Values = { email: string; age: number }
type Supplied = keyof FieldOf<unknown>
type EntryFor<TComponent> = PropsEntry<ExtraProps<TComponent, Supplied>, Values>

type WithoutProps = ComponentType<FieldOf<string>>
type WithOptionalProps = ComponentType<FieldOf<string> & { label?: string }>
type WithRequiredProps = ComponentType<FieldOf<string> & { label: string; hint?: string }>
type WithPropVariants = ComponentType<
  FieldOf<string> & ({ mode: 'short'; size: number } | { mode: 'long'; rows?: number })
>
type WithDisjointVariants = ComponentType<FieldOf<string> & ({ min: number } | { pattern: string })>

describe('PropsEntry', () => {
  it('rejects props for a component that takes none of its own', () => {
    expectTypeOf<Record<never, never>>().toExtend<EntryFor<WithoutProps>>()

    // @ts-expect-error the component takes no props of its own
    const entry: EntryFor<WithoutProps> = { props: {} }
    expectTypeOf(entry).not.toBeAny()
  })

  it('makes props optional when every own prop is', () => {
    expectTypeOf<Record<never, never>>().toExtend<EntryFor<WithOptionalProps>>()
    expectTypeOf({ props: { label: 'Email' } }).toExtend<EntryFor<WithOptionalProps>>()
  })

  it('requires props when the component has a required prop', () => {
    expectTypeOf<Record<never, never>>().not.toExtend<EntryFor<WithRequiredProps>>()
    expectTypeOf({ props: { label: 'Email' } }).toExtend<EntryFor<WithRequiredProps>>()
  })

  it('rejects an unknown key and a wrong type', () => {
    const unknownKey: EntryFor<WithOptionalProps> = {
      // @ts-expect-error the widget has no prop `placeholder`
      props: { label: 'Email', placeholder: 'you@example.com' },
    }
    const wrongType: EntryFor<WithOptionalProps> = {
      // @ts-expect-error `label` is a string
      props: { label: 1 },
    }
    expectTypeOf(unknownKey).not.toBeAny()
    expectTypeOf(wrongType).not.toBeAny()
  })

  it('never offers the field under props', () => {
    const entry: EntryFor<WithOptionalProps> = {
      // @ts-expect-error the renderer supplies the field
      props: { field: undefined },
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('takes props as a function of the values', () => {
    const entry: EntryFor<WithRequiredProps> = {
      props: (values) => {
        expectTypeOf(values).toEqualTypeOf<Values>()

        return { label: values.email }
      },
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('checks the types of what a props function returns', () => {
    const entry: EntryFor<WithRequiredProps> = {
      // @ts-expect-error `label` is a string
      props: (values) => ({ label: values.age }),
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('lets an unknown key through a props function, as TypeScript checks excess keys on literals only', () => {
    const entry: EntryFor<WithRequiredProps> = {
      props: (values) => ({ label: values.email, placeholder: 'you@example.com' }),
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('asks for props when the variants of a union share no key', () => {
    expectTypeOf<Record<never, never>>().not.toExtend<EntryFor<WithDisjointVariants>>()
    expectTypeOf({ props: { pattern: '[0-9]+' } }).toExtend<EntryFor<WithDisjointVariants>>()
  })

  it('offers each variant of a component whose props are a union', () => {
    expectTypeOf({ props: { mode: 'short', size: 20 } as const }).toExtend<
      EntryFor<WithPropVariants>
    >()
    expectTypeOf({ props: { mode: 'long' } as const }).toExtend<EntryFor<WithPropVariants>>()

    const entry: EntryFor<WithPropVariants> = {
      // @ts-expect-error a short variant needs its size
      props: { mode: 'short' },
    }
    expectTypeOf(entry).not.toBeAny()
  })
})
