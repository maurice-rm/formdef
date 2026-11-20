// @vitest-environment jsdom
// The other tests run without a DOM, as the root entry runs on a server.
import { createRegistry, type FieldOf, type StepperProps, useFieldParts } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DocumentItem, FieldItem, FormDocument } from '../form-document'
import { createFieldKinds } from '../kinds/create-field-kinds'
import { defineFieldKind } from '../kinds/define-field-kind'
import { setting } from '../kinds/setting'
import { createDocumentForm } from './create-document-form'

type Option = { value: string; label: string }

type LabelProps = { label: string; description?: string; required?: boolean }

const TextField = ({
  field,
  label,
  description,
  required,
  suffix,
}: FieldOf<string> & LabelProps & { suffix?: string }): ReactNode => {
  const { control, isErrorDue, errors } = useFieldParts(field)
  return (
    <div>
      <label htmlFor={control.id}>{required ? `${label} *` : label}</label>
      {description !== undefined && <p>{description}</p>}
      <input
        {...control}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {suffix !== undefined && <span>{`in ${suffix}`}</span>}
      {isErrorDue && <p role="alert">{errors.join(' ')}</p>}
    </div>
  )
}
TextField.emptyValue = ''

const ChoiceField = ({
  field,
  label,
  options,
}: FieldOf<string> & LabelProps & { options: Option[] }): ReactNode => {
  const { control } = useFieldParts(field)
  return (
    <div>
      <label htmlFor={control.id}>{label}</label>
      <select
        {...control}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
ChoiceField.emptyValue = ''

const Stepper = ({
  steps,
  next,
  isLast,
  children,
}: StepperProps<{ description?: string }>): ReactNode => (
  <section aria-label="Stepper">
    <ol>
      {steps.map((step) => (
        <li key={step.label} aria-current={step.isCurrent ? 'step' : undefined}>
          {step.description === undefined ? step.label : `${step.label}: ${step.description}`}
        </li>
      ))}
    </ol>
    {children}
    <button type="button" onClick={next}>
      {isLast ? 'Submit' : 'Next'}
    </button>
  </section>
)

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField, choice: ChoiceField },
  structure: { stepper: Stepper },
})

const kinds = createFieldKinds(registry, [
  defineFieldKind(registry, { name: 'text', label: 'Text', widget: 'text', valueType: 'text' }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: 'decimal',
    settings: { unit: setting.text({ label: 'Unit', required: true, varies: true }) },
    props: ({ unit }) => ({ suffix: unit }),
  }),
  defineFieldKind(registry, {
    name: 'choice',
    label: 'Choice',
    widget: 'choice',
    valueType: 'choice',
    settings: { options: setting.options({ label: 'Options' }) },
    props: ({ options }) => ({ options }),
  }),
])

const field = (key: string, kind: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind,
  label: key,
  ...extra,
})

const houseType = field('house', 'choice', {
  label: 'House type',
  settings: {
    options: [
      { value: 'o1', label: 'Detached' },
      { value: 'o2', label: 'Apartment block' },
    ],
  },
})
const isApartmentBlock = { field: 'house', op: 'equals', value: 'o2' } as const

const plain = (...items: DocumentItem[]): FormDocument => ({ format: 1, items })

const choose = async (label: string, value: string): Promise<void> => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  })
}

const type = async (label: string, value: string): Promise<void> => {
  await act(async () => {
    const input = screen.getByLabelText(label)
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  })
}

const click = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

afterEach(() => {
  cleanup()
})

describe('createDocumentForm without steps', () => {
  it('renders each field with its label, hint and whether it is required', () => {
    const Form = createDocumentForm(
      plain(field('name', 'text', { label: 'Name', hint: 'As on the bell', required: true })),
      kinds,
    )
    render(<Form />)

    expect(screen.getByLabelText('Name *')).toBeDefined()
    expect(screen.getByText('As on the bell')).toBeDefined()
  })

  it('shows fields, rows and sections as the answers meet their conditions', async () => {
    const Form = createDocumentForm(
      plain(
        houseType,
        field('flats', 'text', { label: 'Flats', visibleWhen: isApartmentBlock }),
        {
          type: 'row',
          visibleWhen: isApartmentBlock,
          items: [field('floors', 'text', { label: 'Floors' })],
        },
        {
          type: 'section',
          label: 'Insulation',
          visibleWhen: isApartmentBlock,
          items: [field('roof', 'text', { label: 'Roof' })],
        },
      ),
      kinds,
    )
    render(<Form />)

    expect(screen.queryByLabelText('Flats')).toBeNull()
    expect(screen.queryByLabelText('Floors')).toBeNull()
    expect(screen.queryByText('Insulation')).toBeNull()

    await choose('House type', 'o2')

    expect(screen.getByLabelText('Flats')).toBeDefined()
    expect(screen.getByLabelText('Floors')).toBeDefined()
    expect(screen.getByText('Insulation')).toBeDefined()
    expect(screen.getByLabelText('Roof')).toBeDefined()
  })

  it('updates a required condition and a setting that follows an answer', async () => {
    const Form = createDocumentForm(
      plain(
        houseType,
        field('area', 'measure', {
          label: 'Area',
          required: isApartmentBlock,
          settings: {
            unit: { cases: [{ when: isApartmentBlock, value: 'm²' }], otherwise: 'ft²' },
          },
        }),
      ),
      kinds,
    )
    render(<Form />)

    expect(screen.getByLabelText('Area')).toBeDefined()
    expect(screen.getByText('in ft²')).toBeDefined()

    await choose('House type', 'o2')

    expect(screen.getByLabelText('Area *')).toBeDefined()
    expect(screen.getByText('in m²')).toBeDefined()
  })

  it("validates with the document's validator and submits the answers of shown fields", async () => {
    const onSubmit = vi.fn()
    const Form = createDocumentForm(
      plain(
        houseType,
        field('name', 'text', { label: 'Name', required: true }),
        field('flats', 'text', { label: 'Flats', visibleWhen: isApartmentBlock }),
      ),
      kinds,
      { messages: { required: () => 'Pflichtfeld' } },
    )
    render(<Form aria-label="Order" options={{ onSubmit: ({ value }) => onSubmit(value) }} />)
    const submit = async (): Promise<void> => {
      await act(async () => {
        fireEvent.submit(screen.getByRole('form', { name: 'Order' }))
      })
    }

    await submit()
    expect(screen.getByRole('alert').textContent).toBe('Pflichtfeld')
    expect(onSubmit).not.toHaveBeenCalled()

    await choose('House type', 'o1')
    await type('Name *', 'Ada')
    await submit()
    expect(onSubmit).toHaveBeenCalledWith({ house: 'o1', name: 'Ada', flats: '' })
  })
})

describe('createDocumentForm with steps', () => {
  const document: FormDocument = {
    format: 1,
    steps: [
      {
        key: 'building',
        label: 'Building',
        description: 'Size and age',
        items: [
          houseType,
          field('flats', 'text', { label: 'Flats', required: true, visibleWhen: isApartmentBlock }),
        ],
      },
      {
        key: 'block',
        label: 'Apartment block',
        visibleWhen: isApartmentBlock,
        items: [field('caretaker', 'text', { label: 'Caretaker' })],
      },
      {
        key: 'contact',
        label: 'Contact',
        items: [field('name', 'text', { label: 'Name', required: true })],
      },
    ],
  }

  it('renders the first step in the stepper, with the steps that show and their descriptions', () => {
    const Form = createDocumentForm(document, kinds)
    render(<Form />)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Building: Size and age',
      'Contact',
    ])
    expect(screen.getByLabelText('House type')).toBeDefined()
    expect(screen.queryByLabelText('Name *')).toBeNull()
  })

  it('moves on past a required field that does not show, and adds a step once it shows', async () => {
    const Form = createDocumentForm(document, kinds)
    render(<Form />)

    await choose('House type', 'o1')
    await click('Next')
    expect(screen.getByLabelText('Name *')).toBeDefined()

    cleanup()
    render(<Form />)
    await choose('House type', 'o2')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    await click('Next')
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByLabelText('Flats *')).toBeDefined()
  })
})
