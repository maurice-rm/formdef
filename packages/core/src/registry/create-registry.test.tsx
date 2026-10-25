import { createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { BodyProps } from '../config/structure'
import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'

const { fieldContext, formContext } = createFormHookContexts()

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
    />
  </label>
)

const NumberField = ({ field, label }: FieldOf<number> & { label: string }): ReactNode => (
  <label>
    {label}
    <input
      type="number"
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.valueAsNumber)}
    />
  </label>
)

const base = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })
const extended = base.extendRegistry({ widgets: { number: NumberField } })

const SignIn = (): ReactNode => {
  const form = base.formHook.useAppForm({ defaultValues: { email: 'ada@example.com' } })

  return (
    <form.AppForm>
      <form.AppField name="email">
        {(field) => <field.text field={field} label="Email" />}
      </form.AppField>
    </form.AppForm>
  )
}

const Profile = (): ReactNode => {
  const form = extended.formHook.useAppForm({ defaultValues: { name: 'Ada', age: 36 } })

  return (
    <form.AppForm>
      <form.AppField name="name">
        {(field) => <field.text field={field} label="Name" />}
      </form.AppField>
      <form.AppField name="age">
        {(field) => <field.number field={field} label="Age" />}
      </form.AppField>
    </form.AppForm>
  )
}

const BaseWidgets = (): ReactNode => {
  const form = base.formHook.useAppForm({ defaultValues: { age: 36 } })

  return (
    <form.AppForm>
      <form.AppField name="age">
        {(field) => <output>{'number' in field ? 'extended' : 'unchanged'}</output>}
      </form.AppField>
    </form.AppForm>
  )
}

describe('createRegistry', () => {
  it("hands out TanStack's form hook with the registered widgets", () => {
    render(<SignIn />)

    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'ada@example.com')
  })

  it("leaves out TanStack's own extension, which extendRegistry replaces", () => {
    expect(base.formHook).not.toHaveProperty('extendForm')
  })

  it('extends into a new registry with the widgets of both', () => {
    render(<Profile />)

    expect(screen.getByLabelText('Name')).toHaveProperty('value', 'Ada')
    expect(screen.getByLabelText('Age')).toHaveProperty('value', '36')
  })

  it('leaves the registry it extends unchanged', () => {
    render(<BaseWidgets />)

    expect(screen.getByText('unchanged')).toBeDefined()
  })
})

const profileSchema = z.object({ name: z.string().min(1, 'Enter a name'), age: z.number() })

afterEach(cleanup)

describe('registry.createForm', () => {
  it('renders a config with the widgets of the registry and submits its values', async () => {
    const onSubmit = vi.fn()
    const ProfileForm = extended.createForm({
      schema: profileSchema,
      defaultValues: { name: 'Ada', age: 36 },
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        age: { widget: 'number', props: { label: 'Age' } },
      },
      onSubmit: ({ value }) => onSubmit(value),
    })
    render(<ProfileForm aria-label="Profile" />)

    expect(screen.getByLabelText('Age')).toHaveProperty('value', '36')
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'))
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', age: 36 })
  })
})

type Address = { street: string; zip: string }
type Customer = { name: string; billing: Address; shipping: Address }

const CUSTOMER: Customer = {
  name: 'Ada',
  billing: { street: 'Main Street 1', zip: '12345' },
  shipping: { street: '', zip: '' },
}

const addressFields = {
  street: { widget: 'text', props: { label: 'Street' } },
  zip: {
    widget: 'text',
    props: { label: 'ZIP' },
    visibleWhen: (values: Address) => values.street !== '',
  },
} as const

const AddressGroup = base.formHook.withFieldGroup({
  defaultValues: { street: '', zip: '' } as Address,
  render: ({ group }) => <base.Fields form={group} fields={addressFields} />,
})

const inputNames = (): (string | null)[] =>
  screen.getAllByRole('textbox').map((input) => input.getAttribute('name'))

const Checkout = ({ onSubmit }: { onSubmit: (value: Customer) => void }): ReactNode => {
  const form = base.formHook.useAppForm({
    defaultValues: CUSTOMER,
    onSubmit: ({ value }) => onSubmit(value),
  })

  return (
    <form.AppForm>
      <form
        aria-label="Checkout"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <base.Fields form={form} fields={{ name: { widget: 'text', props: { label: 'Name' } } }} />
        <hr />
        <base.Fields
          form={form}
          fields={{
            billing: {
              fields: {
                street: { widget: 'text', props: { label: 'Street' } },
                zip: { widget: 'text', props: { label: 'ZIP' } },
              },
            },
          }}
        />
      </form>
    </form.AppForm>
  )
}

const Addresses = (): ReactNode => {
  const form = base.formHook.useAppForm({ defaultValues: CUSTOMER })

  return (
    <form.AppForm>
      <AddressGroup form={form} fields="billing" />
      <AddressGroup form={form} fields="shipping" />
    </form.AppForm>
  )
}

const Body = ({ children }: BodyProps): ReactNode => <div data-testid="body">{children}</div>

describe('registry.Fields', () => {
  it('renders parts of a config into a shell the caller owns', async () => {
    const onSubmit = vi.fn()
    render(<Checkout onSubmit={onSubmit} />)

    expect(inputNames()).toEqual(['name', 'billing.street', 'billing.zip'])
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'))
    })
    expect(onSubmit).toHaveBeenCalledWith(CUSTOMER)
  })

  it('renders one field group at billing and at shipping', () => {
    render(<Addresses />)

    expect(inputNames()).toEqual(['billing.street', 'billing.zip', 'shipping.street'])

    fireEvent.change(screen.getAllByLabelText('Street')[1] as HTMLElement, {
      target: { value: 'Side Street 2' },
    })

    expect(inputNames()).toEqual([
      'billing.street',
      'billing.zip',
      'shipping.street',
      'shipping.zip',
    ])
    expect(
      screen.getAllByLabelText('Street').map((input) => (input as HTMLInputElement).value),
    ).toEqual(['Main Street 1', 'Side Street 2'])
  })
})

describe('extendRegistry', () => {
  it('keeps the structure slots of the registry it extends', () => {
    const framed = createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      structure: { body: Body },
    }).extendRegistry({ widgets: { number: NumberField } })
    const AgeForm = framed.createForm({
      schema: z.object({ age: z.number() }),
      defaultValues: { age: 36 },
      fields: { age: { widget: 'number', props: { label: 'Age' } } },
    })
    render(<AgeForm />)

    expect(screen.getByTestId('body').contains(screen.getByLabelText('Age'))).toBe(true)
  })
})
