import {
  createRegistry,
  type FieldOf,
  type FieldsOf,
  type FormConfig,
  type FormProps,
  type LayoutOf,
  type RowProps,
} from '@formdef/core'
import { type ComponentType, createRef, type ReactNode } from 'react'
import { z } from 'zod'

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input value={field.value} onChange={(event) => field.handleChange(event.target.value)} />
  </label>
)

const NumberField = ({ field }: FieldOf<number>): ReactNode => field.value

const SubmitButton = ({ label }: { label: string }): ReactNode => (
  <button type="submit">{label}</button>
)

const Row = ({ children }: RowProps): ReactNode => <div>{children}</div>

const registry = createRegistry({ widgets: { text: TextField } })
  .extendRegistry({ widgets: { number: NumberField }, formComponents: { SubmitButton } })
  .extendRegistry({ structure: { row: Row } })

// @ts-expect-error a widget named `text` is already registered
registry.extendRegistry({ widgets: { text: TextField } })

export const Profile = (): ReactNode => {
  const form = registry.formHook.useAppForm({ defaultValues: { name: '', age: 0 } })

  return (
    <>
      <form.Field name="name">{(field) => <field.text field={field} label="Name" />}</form.Field>
      <form.Field name="age">{(field) => <field.number field={field} />}</form.Field>
      {/* @ts-expect-error no widget named `date` is registered */}
      <form.Field name="name">{(field) => <field.date field={field} />}</form.Field>
      <form.SubmitButton label="Save" />
    </>
  )
}

type Address = { street: string; zip: string }
type Customer = { name: string; billing: Address; shipping: Address }

const addressFields: FieldsOf<typeof registry, Address, Customer> = {
  street: { widget: 'text', props: { label: 'Street' } },
  zip: {
    widget: 'text',
    props: { label: 'Postal code' },
    visibleWhen: (values) => values.name !== '',
  },
}

export const customerFields: FieldsOf<typeof registry, Customer> = {
  name: { widget: 'text', props: { label: 'Name' } },
  billing: { fields: addressFields },
  shipping: { fields: addressFields },
}

export const customerLayout: LayoutOf<typeof registry, Customer> = [
  { row: ['name'] },
  { section: 'Addresses', layout: ['billing', 'shipping'] },
  { component: 'SubmitButton', props: { label: 'Save' } },
  {
    render: (form) => (
      <form.Subscribe selector={(state) => state.values.name}>
        {(name) => <p>{name === '' ? 'Who is ordering?' : `Order for ${name}`}</p>}
      </form.Subscribe>
    ),
  },
]

export const wrongWidget: FieldsOf<typeof registry, Address> = {
  // @ts-expect-error no widget named `date` is registered
  street: { widget: 'date' },
}

const customerSchema = z.object({
  name: z.string().min(1),
  billing: z.object({ street: z.string(), zip: z.string() }),
  shipping: z.object({ street: z.string(), zip: z.string() }),
})

export const customerConfig: FormConfig<typeof registry, typeof customerSchema> = {
  schema: customerSchema,
  defaultValues: { name: '', billing: { street: '', zip: '' }, shipping: { street: '', zip: '' } },
  fields: customerFields,
  layout: customerLayout,
  validation: { mode: 'blurThenChange' },
  onSubmit: ({ value }) => console.info(value.name),
}

declare const CustomerForm: ComponentType<FormProps<typeof customerSchema>>

export const EditCustomer = ({ name }: { name: string }): ReactNode => (
  <CustomerForm
    className="max-w-prose"
    ref={createRef<HTMLFormElement>()}
    options={{
      defaultValues: { name, billing: { street: '', zip: '' }, shipping: { street: '', zip: '' } },
      onSubmit: ({ value }) => console.info(value.name),
    }}
  />
)

// @ts-expect-error the form submits through its options
export const SubmitsItself = (): ReactNode => <CustomerForm onSubmit={() => undefined} />

export const OrderForm = registry.createForm({
  schema: customerSchema,
  defaultValues: { name: '', billing: { street: '', zip: '' }, shipping: { street: '', zip: '' } },
  fields: customerFields,
  layout: customerLayout,
})

export const SignUpForm = registry.createForm({
  schema: customerSchema,
  fields: customerFields,
  layout: [{ row: ['name'] }, { section: 'Addresses', layout: ['billing', 'shipping'] }],
  onSubmit: ({ value }) => console.info(value.billing.zip),
})

export const SignUp = (): ReactNode => (
  <SignUpForm
    options={{
      defaultValues: {
        name: '',
        billing: { street: '', zip: '' },
        shipping: { street: '', zip: '' },
      },
    }}
  />
)

// @ts-expect-error the config leaves the default values to the instance
export const SignUpWithoutValues = (): ReactNode => <SignUpForm />

// The oldest supported TypeScript types `values` of a field's condition and derived props on
// every level; 5.6 and earlier leave them implicitly `any`.
export const ShippingForm = registry.createForm({
  schema: customerSchema,
  fields: {
    name: { widget: 'text', props: (values) => ({ label: values.billing.zip }) },
    billing: { fields: addressFields },
    shipping: {
      fields: {
        street: {
          widget: 'text',
          props: { label: 'Street' },
          visibleWhen: (values) => values.billing.street !== '',
        },
        zip: { widget: 'text', props: { label: 'ZIP' } },
      },
    },
  },
})

registry.createForm({
  schema: customerSchema,
  fields: { name: { widget: 'text', props: { label: 'Name' } } },
  // @ts-expect-error billing is not described in fields
  layout: ['name', 'billing'],
})

registry.createForm({
  schema: customerSchema,
  fields: {
    // @ts-expect-error the text widget takes no colour
    name: { widget: 'text', props: { label: 'Name', colour: 'red' } },
  },
})

export const OwnShell = (): ReactNode => {
  const form = registry.formHook.useAppForm({
    defaultValues: {
      name: '',
      billing: { street: '', zip: '' },
      shipping: { street: '', zip: '' },
    },
  })

  return (
    <>
      <registry.Fields form={form} fields={customerFields} layout={['name', 'billing']} />
      {/* @ts-expect-error shipping is not described in fields */}
      <registry.Fields form={form} fields={{ name: customerFields.name }} layout={['shipping']} />
    </>
  )
}

const addressGroup = registry.formHook.defineAppFieldGroup(({ strict }) => ({
  street: strict<string>(),
  zip: strict<string>(),
}))

const AddressFields = ({ group }: { group: typeof addressGroup.fields }): ReactNode => (
  <registry.Fields
    form={group}
    fields={{
      street: { widget: 'text', props: { label: 'Street' } },
      zip: {
        widget: 'text',
        props: { label: 'ZIP' },
        visibleWhen: (values) => values.street !== '',
      },
    }}
  />
)

export const AddressGroup = addressGroup.bindComponent(AddressFields, 'group')
