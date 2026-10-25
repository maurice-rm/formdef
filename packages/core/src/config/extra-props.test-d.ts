import type { ComponentType, MemoExoticComponent, ReactNode, Ref } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldOf } from '../widget/field-of'
import type { ExtraProps } from './extra-props'

type Supplied = keyof FieldOf<unknown>

type WithRequiredProps = ComponentType<FieldOf<string> & { label: string; hint?: string }>
type WithPropVariants = ComponentType<
  FieldOf<string> & ({ mode: 'short'; size: number } | { mode: 'long'; rows?: number })
>
type WithRef = ComponentType<FieldOf<string> & { label?: string; ref?: Ref<HTMLInputElement> }>

describe('ExtraProps', () => {
  it('leaves out the props the renderer supplies', () => {
    expectTypeOf<ExtraProps<WithRequiredProps, Supplied>>().toEqualTypeOf<{
      label: string
      hint?: string
    }>()
  })

  it('leaves out ref and key', () => {
    expectTypeOf<ExtraProps<WithRef, Supplied>>().toEqualTypeOf<{ label?: string }>()
  })

  it('reads the props of a memoized component', () => {
    type Memoized = MemoExoticComponent<(props: FieldOf<string> & { label: string }) => ReactNode>

    expectTypeOf<ExtraProps<Memoized, Supplied>>().toEqualTypeOf<{ label: string }>()
  })

  it('keeps the required props of a component with an index signature', () => {
    type WithIndexSignature = ComponentType<
      FieldOf<string> & { label: string; [attribute: string]: unknown }
    >

    expectTypeOf<ExtraProps<WithIndexSignature, Supplied>>().toEqualTypeOf<{
      label: string
      [attribute: string]: unknown
    }>()
  })

  it('keeps the variants of a component whose props are a union', () => {
    expectTypeOf<ExtraProps<WithPropVariants, Supplied>>().toEqualTypeOf<
      { mode: 'short'; size: number } | { mode: 'long'; rows?: number }
    >()
  })
})
