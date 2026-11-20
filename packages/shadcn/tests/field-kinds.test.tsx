import { checkDocument, createValidator, type FormDocument } from '@formdef/document'
import { createDocumentForm } from '@formdef/document/react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { catalog } from '@/lib/formdef/field-kinds'

vi.mock('@/lib/formdef', () => import('./helpers/full-registry'))

afterEach(cleanup)

const OPTIONS = [
  { value: 'o1', label: 'Detached' },
  { value: 'o2', label: 'Apartment block' },
]

const document: FormDocument = {
  format: 1,
  items: [
    { type: 'field', key: 'name', kind: 'text', label: 'Name', required: true },
    { type: 'field', key: 'email', kind: 'email', label: 'Email' },
    { type: 'field', key: 'notes', kind: 'longText', label: 'Notes' },
    {
      type: 'field',
      key: 'area',
      kind: 'decimal',
      label: 'Living area',
      settings: { unit: 'm²', min: 10 },
    },
    { type: 'field', key: 'rooms', kind: 'number', label: 'Rooms', settings: { min: 1 } },
    { type: 'field', key: 'consent', kind: 'checkbox', label: 'I agree' },
    {
      type: 'field',
      key: 'house',
      kind: 'radio',
      label: 'House type',
      settings: { options: OPTIONS },
    },
    { type: 'field', key: 'roof', kind: 'select', label: 'Roof', settings: { options: OPTIONS } },
    {
      type: 'field',
      key: 'rooms2',
      kind: 'checkboxes',
      label: 'Heated rooms',
      settings: { options: OPTIONS, maxCount: 1 },
    },
    {
      type: 'field',
      key: 'built',
      kind: 'date',
      label: 'Built',
      settings: { latest: '2026-01-01' },
    },
    { type: 'block', key: 'b1', kind: 'heading', settings: { text: 'Heating' } },
    { type: 'block', key: 'b3', kind: 'heading', settings: { text: 'Contact', level: 2 } },
    {
      type: 'block',
      key: 'b2',
      kind: 'notice',
      settings: { title: 'Before you start', body: 'Have the **meter reading** at hand.' },
    },
  ],
}

describe('the shipped field kinds', () => {
  it('make a sound document of every kind', () => {
    expect(checkDocument(document, catalog)).toEqual([])
  })

  it('render each field with its widget, and a decimal with its unit', () => {
    const Form = createDocumentForm(document, catalog)
    render(<Form />)

    expect(screen.getByRole('textbox', { name: /Name/ })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('type')).toBe('email')
    expect(screen.getByRole('textbox', { name: 'Living area' }).getAttribute('inputmode')).toBe(
      'decimal',
    )
    expect(screen.getByText('m²')).toBeDefined()
    expect(screen.getByRole('spinbutton', { name: 'Rooms' })).toBeDefined()
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toBeDefined()
    expect(screen.getByRole('radiogroup', { name: 'House type' })).toBeDefined()
    expect(screen.getAllByRole('checkbox', { name: 'Apartment block' })).toHaveLength(1)
    expect(screen.getByRole('textbox', { name: 'Notes' }).tagName).toBe('TEXTAREA')
    expect(screen.getByRole('combobox', { name: 'Roof' })).toBeDefined()
    expect(screen.getByRole('button', { name: /Built/ })).toBeDefined()
  })

  it('render a heading and a notice with its title and formatted text', () => {
    const Form = createDocumentForm(document, catalog)
    render(<Form />)

    expect(screen.getByRole('heading', { level: 3, name: 'Heating' })).toBeDefined()
    expect(screen.getByRole('heading', { level: 2, name: 'Contact' })).toBeDefined()
    expect(screen.getByRole('note').textContent).toBe(
      'Before you startHave the meter reading at hand.',
    )
    expect(screen.getByText('meter reading').tagName).toBe('STRONG')
  })

  it('draw the stepper and a section as their displays say', () => {
    const stepped: FormDocument = {
      format: 1,
      display: { kind: 'rail' },
      steps: [
        {
          key: 's1',
          label: 'Contact',
          items: [
            {
              type: 'section',
              label: 'Address',
              display: { kind: 'group' },
              items: [{ type: 'field', key: 'street', kind: 'text', label: 'Street' }],
            },
          ],
        },
      ],
    }
    expect(checkDocument(stepped, catalog)).toEqual([])

    const Form = createDocumentForm(stepped, catalog)
    const { container } = render(<Form />)

    expect(container.querySelector('[data-slot="stepper"]')?.getAttribute('data-variant')).toBe(
      'rail',
    )
    expect(screen.getByText('Address').getAttribute('data-variant')).toBe('label')
  })

  it('validate answers with the rules their settings give', () => {
    const validator = createValidator(document, catalog)
    const result = validator['~standard'].validate({
      name: 'Ada',
      email: 'ada',
      area: '9,5',
      rooms: 1.5,
      rooms2: ['o1', 'o2'],
      built: '2026-03-01',
    })

    expect(result.issues?.map(({ path, code }) => [path.join('.'), code])).toEqual([
      ['email', 'email'],
      ['area', 'min'],
      ['rooms', 'integer'],
      ['rooms2', 'maxCount'],
      ['built', 'latest'],
    ])
  })
})
