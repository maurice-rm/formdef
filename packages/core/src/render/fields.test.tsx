import { type AnyFormApi, createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RowProps, SectionProps } from '../config/structure'
import { errorsOf } from '../widget/errors-of'
import type { FieldOf } from '../widget/field-of'
import { Fields } from './fields'

const { fieldContext, formContext, useFormContext } = createFormHookContexts()

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

const Section = ({ label, children, tone }: SectionProps & { tone: string }): ReactNode => (
  <section aria-label={label} data-tone={tone}>
    {children}
  </section>
)

const Row = ({ children, columns }: RowProps & { columns: number }): ReactNode => (
  <div data-columns={columns}>{children}</div>
)

const SubmitButton = ({ label }: { label: string }): ReactNode => {
  const form = useFormContext()

  return (
    <button type="button" onClick={() => form.handleSubmit()}>
      {`${label} (${form.state.submissionAttempts})`}
    </button>
  )
}

const widgets = { text: TextField }
const formComponents = { SubmitButton }

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: widgets,
  formComponents,
})

const PARTS = { widgets, formComponents, structure: {} }
const PARTS_WITH_SLOTS = { widgets, formComponents, structure: { section: Section, row: Row } }

type Address = { street: string; zip: string }
type Order = { email: string; address: Address; note: string }

const DEFAULT_VALUES: Order = {
  email: 'ada@example.com',
  address: { street: 'Main Street 1', zip: '12345' },
  note: 'Ring twice',
}

type OrderFormProps = {
  fields: Record<string, object>
  layout?: readonly unknown[] | undefined
  parts?: typeof PARTS | typeof PARTS_WITH_SLOTS
  onForm?: (form: AnyFormApi) => void
}

const OrderForm = ({ fields, layout, parts = PARTS, onForm }: OrderFormProps): ReactNode => {
  const form = useAppForm({ defaultValues: DEFAULT_VALUES })
  onForm?.(form)

  return (
    <form.AppForm>
      <Fields parts={parts} form={form} fields={fields} layout={layout} />
    </form.AppForm>
  )
}

const ORDER_FIELDS = {
  email: { widget: 'text', props: { label: 'Email' } },
  note: { widget: 'text', props: { label: 'Note' } },
  address: {
    fields: {
      street: { widget: 'text', props: { label: 'Street' } },
      zip: { widget: 'text', props: { label: 'ZIP' } },
    },
  },
}

const inputNames = (): (string | null)[] =>
  screen.getAllByRole('textbox').map((input) => input.getAttribute('name'))

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

describe('Fields with a layout', () => {
  it('renders the fields the layout names, in its order', () => {
    render(<OrderForm fields={ORDER_FIELDS} layout={['note', 'email']} />)

    expect(inputNames()).toEqual(['note', 'email'])
  })

  it('orders an object level by the layout of its entry', () => {
    render(
      <OrderForm fields={{ address: { ...ORDER_FIELDS.address, layout: ['zip', 'street'] } }} />,
    )

    expect(inputNames()).toEqual(['address.zip', 'address.street'])
  })

  it('renders a section as a fieldset with a legend and a row as a marked div without slots', () => {
    const { container } = render(
      <OrderForm
        fields={ORDER_FIELDS}
        layout={[
          {
            section: 'Contact',
            props: { className: 'contact' },
            layout: [{ row: ['email', 'note'], props: { className: 'pair' } }],
          },
        ]}
      />,
    )

    const section = screen.getByRole('group', { name: 'Contact' })
    expect(section.tagName).toBe('FIELDSET')
    expect(section.className).toBe('contact')
    const row = container.querySelector('[data-formdef-row]')
    expect(row?.className).toBe('pair')
    expect(row?.querySelectorAll('input')).toHaveLength(2)
  })

  it('renders a section and a row through the registered slots, with their props', () => {
    const { container } = render(
      <OrderForm
        parts={PARTS_WITH_SLOTS}
        fields={ORDER_FIELDS}
        layout={[
          {
            section: 'Contact',
            props: { tone: 'quiet' },
            layout: [{ row: ['email', 'note'], props: { columns: 2 } }],
          },
        ]}
      />,
    )

    expect(screen.getByRole('region', { name: 'Contact' }).dataset.tone).toBe('quiet')
    expect(container.querySelector('[data-columns="2"]')?.querySelectorAll('input')).toHaveLength(2)
  })

  it('nests sections and rows', () => {
    render(
      <OrderForm
        fields={ORDER_FIELDS}
        layout={[
          { section: 'Order', layout: [{ section: 'Contact', layout: [{ row: ['email'] }] }] },
        ]}
      />,
    )

    const outer = screen.getByRole('group', { name: 'Order' })
    const inner = screen.getByRole('group', { name: 'Contact' })
    expect(outer.contains(inner)).toBe(true)
    expect(inner.querySelector('[data-formdef-row] input')?.getAttribute('name')).toBe('email')
  })

  it('places a form component with its props, reading the form from the context', () => {
    render(
      <OrderForm
        fields={ORDER_FIELDS}
        layout={['email', { component: 'SubmitButton', props: { label: 'Order' } }]}
      />,
    )

    expect(screen.getByRole('button').textContent).toBe('Order (0)')
  })

  it('hands an inline entry the form', () => {
    render(
      <OrderForm
        fields={ORDER_FIELDS}
        layout={[
          {
            render: (form: AnyFormApi) => <output>{form.state.values.note as string}</output>,
          },
        ]}
      />,
    )

    expect(screen.getByRole('status').textContent).toBe('Ring twice')
  })

  it.each([
    [
      ['phone'],
      undefined,
      'formdef: the layout of the form names "phone", which the level does not describe.',
    ],
    [
      ['toString'],
      undefined,
      'formdef: the layout of the form names "toString", which the level does not describe.',
    ],
    [
      undefined,
      ['country'],
      'formdef: the layout of "address" names "country", which the level does not describe.',
    ],
  ])(
    'throws with the path when a layout names a key the level does not describe',
    (layout, addressLayout, message) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const fields = { address: { ...ORDER_FIELDS.address, layout: addressLayout } }

      expect(() => render(<OrderForm fields={fields} layout={layout} />)).toThrow(message)
    },
  )

  it.each([
    [
      [{ component: 'Hint' }],
      undefined,
      'formdef: the layout of the form places the unregistered form component "Hint".',
    ],
    [
      [{ component: 'toString' }],
      undefined,
      'formdef: the layout of the form places the unregistered form component "toString".',
    ],
    [
      undefined,
      [{ component: 'Hint' }],
      'formdef: the layout of "address" places the unregistered form component "Hint".',
    ],
  ])(
    'throws with the path when a layout places an unregistered form component',
    (layout, addressLayout, message) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const fields = { address: { ...ORDER_FIELDS.address, layout: addressLayout } }

      expect(() => render(<OrderForm fields={fields} layout={layout} />)).toThrow(message)
    },
  )

  it('renders every kind of entry, nested and with names repeated across levels, without a warning', () => {
    const consoleError = vi.spyOn(console, 'error')
    const fields = {
      ...ORDER_FIELDS,
      address: {
        fields: {
          ...ORDER_FIELDS.address.fields,
          email: { widget: 'text', props: { label: 'Address email' } },
        },
        layout: [{ row: ['street', 'zip'] }, 'email', { render: () => 'Delivery only' }],
      },
    }

    for (const parts of [PARTS, PARTS_WITH_SLOTS]) {
      render(
        <OrderForm
          parts={parts}
          fields={fields}
          layout={[
            'email',
            {
              section: 'Delivery',
              props: { tone: 'quiet' },
              layout: [{ row: ['address', 'note'], props: { columns: 2 } }, 'email', 'email'],
            },
            { render: () => 'Fine print' },
            { component: 'SubmitButton', props: { label: 'Order' } },
            { component: 'SubmitButton', props: { label: 'Order again' } },
          ]}
        />,
      )
      cleanup()
    }

    expect(consoleError).not.toHaveBeenCalled()
  })
})
