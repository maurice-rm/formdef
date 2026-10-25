import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'
import type { FieldsOf } from './fields-of'

const { fieldContext, formContext } = createFormHookContexts()

declare const TextField: ComponentType<FieldOf<string> & { label: string }>
declare const CheckboxField: ComponentType<FieldOf<boolean> & { label: string }>

const registry = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })
const extended = registry.extendRegistry({ widgets: { checkbox: CheckboxField } })

type Address = { street: string; zip: string }
type Customer = {
  name: string
  hasShippingAddress: boolean
  billing: Address
  shipping: Address
}

describe('FieldsOf', () => {
  it('shares a fragment between two places of one form', () => {
    const addressFields: FieldsOf<typeof registry, Address, Customer> = {
      street: { widget: 'text', props: { label: 'Street' } },
      zip: { widget: 'text', props: { label: 'Postal code' } },
    }

    const customerFields: FieldsOf<typeof registry, Customer> = {
      name: { widget: 'text', props: { label: 'Name' } },
      billing: { fields: addressFields },
      shipping: { fields: addressFields, visibleWhen: (values) => values.hasShippingAddress },
    }
    expectTypeOf(customerFields).not.toBeAny()
  })

  it('shares a fragment between forms of one data type', () => {
    const addressFields: FieldsOf<typeof registry, Address, Customer> = {
      zip: {
        widget: 'text',
        props: { label: 'Postal code' },
        visibleWhen: (values) => values.name !== '',
      },
    }

    const createCustomer: FieldsOf<typeof registry, Customer> = {
      billing: { fields: addressFields },
    }
    const editCustomer: FieldsOf<typeof extended, Customer> = {
      hasShippingAddress: { widget: 'checkbox', props: { label: 'Ship elsewhere' } },
      billing: { fields: addressFields },
    }
    expectTypeOf(createCustomer).not.toBeAny()
    expectTypeOf(editCustomer).not.toBeAny()
  })

  it('fits only forms of the data type it names', () => {
    const ownAddressFields: FieldsOf<typeof registry, Address> = {
      zip: { widget: 'text', props: { label: 'Postal code' } },
    }

    const customerFields: FieldsOf<typeof registry, Customer> = {
      // @ts-expect-error the fragment reads the values of an address form, not a customer form
      billing: { fields: ownAddressFields },
    }
    expectTypeOf(customerFields).not.toBeAny()
  })

  it('offers only the widgets of the registry it names', () => {
    const fields: FieldsOf<typeof registry, Customer> = {
      // @ts-expect-error the checkbox is registered only in the extended registry
      hasShippingAddress: { widget: 'checkbox', props: { label: 'Ship elsewhere' } },
    }
    expectTypeOf(fields).not.toBeAny()
  })

  it('describes only the keys of its value type', () => {
    const fields: FieldsOf<typeof registry, Address> = {
      // @ts-expect-error an address has no city
      city: { widget: 'text', props: { label: 'City' } },
    }
    expectTypeOf(fields).not.toBeAny()
  })

  it('takes a registry, nothing else', () => {
    // @ts-expect-error a widget map is not a registry
    type FromWidgets = FieldsOf<{ text: typeof TextField }, Address>
    expectTypeOf<FromWidgets>().not.toBeAny()
  })
})
