import { type AnyFormApi, createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { errorsOf } from '../widget/errors-of'
import type { FieldOf } from '../widget/field-of'
import { Fields } from './fields'

const { fieldContext, formContext } = createFormHookContexts()

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
    />
    {errorsOf(field).map((error) => (
      <span key={error}>{error}</span>
    ))}
  </label>
)

const widgets = { text: TextField }

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: widgets,
  formComponents: {},
})

const PARTS = { widgets }

type Address = { street: string; zip: string }
type Order = { email: string; address: Address; note: string }

const DEFAULT_VALUES: Order = {
  email: 'ada@example.com',
  address: { street: 'Main Street 1', zip: '12345' },
  note: 'Ring twice',
}

type OrderFormProps = {
  fields: Record<string, object>
  onForm?: (form: AnyFormApi) => void
}

const OrderForm = ({ fields, onForm }: OrderFormProps): ReactNode => {
  const form = useAppForm({ defaultValues: DEFAULT_VALUES })
  onForm?.(form)

  return (
    <form.AppForm>
      <Fields parts={PARTS} form={form} fields={fields} />
    </form.AppForm>
  )
}

const needsAt = ({ value }: { value: string }): string | undefined =>
  value.includes('@') ? undefined : 'Needs an @'

const checkedOnMount = (): string => 'Checked on mount'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Fields', () => {
  it('renders the widget of a leaf with the props of its entry', () => {
    render(<OrderForm fields={{ email: { widget: 'text', props: { label: 'Email' } } }} />)

    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'ada@example.com')
  })

  it('hands the widget the field at the path of a nested leaf', () => {
    render(
      <OrderForm
        fields={{ address: { fields: { zip: { widget: 'text', props: { label: 'ZIP' } } } } }}
      />,
    )

    const zip = screen.getByLabelText('ZIP')
    expect(zip).toHaveProperty('name', 'address.zip')
    expect(zip).toHaveProperty('value', '12345')
  })

  it("hands an entry's TanStack options to its field", () => {
    render(
      <OrderForm
        fields={{
          email: { widget: 'text', props: { label: 'Email' }, validators: { onChange: needsAt } },
        }}
      />,
    )

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada' } })

    expect(screen.getByText('Needs an @')).toBeDefined()
  })

  it("keeps formdef's own keys away from the field", () => {
    const listOptionKeys = (field: FieldOf<string>['field']): ReactNode => (
      <output>{Object.keys(field.options).join(',')}</output>
    )
    render(<OrderForm fields={{ note: { render: listOptionKeys, visibleWhen: () => true } }} />)

    const keys = screen.getByRole('status').textContent?.split(',')
    expect(keys).toContain('name')
    expect(keys).not.toContain('render')
    expect(keys).not.toContain('visibleWhen')
  })

  it('mounts a field for an object whose entry carries TanStack options, so its rule runs', () => {
    let form: AnyFormApi | undefined
    render(
      <OrderForm
        fields={{
          address: {
            fields: { zip: { widget: 'text', props: { label: 'ZIP' } } },
            validators: { onMount: checkedOnMount },
          },
        }}
        onForm={(instance) => {
          form = instance
        }}
      />,
    )

    expect(form?.getFieldMeta('address')?.errors).toEqual(['Checked on mount'])
  })

  it('mounts no field for an object whose entry carries no TanStack options', () => {
    let form: AnyFormApi | undefined
    render(
      <OrderForm
        fields={{ address: { fields: { zip: { widget: 'text', props: { label: 'ZIP' } } } } }}
        onForm={(instance) => {
          form = instance
        }}
      />,
    )

    expect(form?.fieldInfo.address?.instance ?? null).toBeNull()
  })

  it('hands a custom entry the real field', () => {
    render(
      <OrderForm
        fields={{
          note: {
            render: (field: FieldOf<string>['field']) => (
              <output>{`${field.name}: ${field.state.value}`}</output>
            ),
          },
        }}
      />,
    )

    expect(screen.getByRole('status').textContent).toBe('note: Ring twice')
  })

  it('renders the entries in the order the level declares them', () => {
    render(
      <OrderForm
        fields={{
          note: { widget: 'text', props: { label: 'Note' } },
          email: { widget: 'text', props: { label: 'Email' } },
          address: { fields: { zip: { widget: 'text', props: { label: 'ZIP' } } } },
        }}
      />,
    )

    const names = screen.getAllByRole('textbox').map((input) => input.getAttribute('name'))
    expect(names).toEqual(['note', 'email', 'address.zip'])
  })

  it.each(['zipcode', 'toString'])('throws with the path when a leaf names `%s`', (name) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() =>
      render(<OrderForm fields={{ address: { fields: { zip: { widget: name } } } }} />),
    ).toThrow(`formdef: field "address.zip" names the unregistered widget "${name}".`)
  })
})
