import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'
import type { LayoutOf } from './layout-of'

const { fieldContext, formContext } = createFormHookContexts()

declare const TextField: ComponentType<FieldOf<string> & { label: string }>
declare const SubmitButton: ComponentType<{ label: string }>

const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField },
  formComponents: { SubmitButton },
})

type Address = { street: string; zip: string }
type Customer = { name: string; billing: Address }

describe('LayoutOf', () => {
  it("arranges the keys of its value type and places the registry's form components", () => {
    const layout: LayoutOf<typeof registry, Customer> = [
      { section: 'Customer', layout: ['name', 'billing'] },
      { component: 'SubmitButton', props: { label: 'Save' } },
    ]
    expectTypeOf(layout).not.toBeAny()
  })

  it('names only keys of its own level', () => {
    // @ts-expect-error `zip` belongs to the address, one level down
    const layout: LayoutOf<typeof registry, Customer> = ['name', 'zip']
    expectTypeOf(layout).not.toBeAny()
  })

  it('reads the values of the whole form in a condition', () => {
    const layout: LayoutOf<typeof registry, Address, Customer> = [
      { row: ['street', 'zip'], visibleWhen: (values) => values.name !== '' },
    ]
    expectTypeOf(layout).not.toBeAny()
  })

  it('places only form components the registry holds', () => {
    // @ts-expect-error no form component is registered as `ResetButton`
    const layout: LayoutOf<typeof registry, Customer> = [{ component: 'ResetButton' }]
    expectTypeOf(layout).not.toBeAny()
  })
})
