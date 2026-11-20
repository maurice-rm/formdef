import { checkDocument, createValidator, type FormDocument } from '@formdef/document'
import { createDocumentForm } from '@formdef/document/react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fieldKinds } from '@/lib/formdef/field-kinds'

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
  ],
}

describe('the shipped field kinds', () => {
  it('make a sound document of every kind', () => {
    expect(checkDocument(document, fieldKinds)).toEqual([])
  })

  it('render each field with its widget, and a decimal with its unit', () => {
    const Form = createDocumentForm(document, fieldKinds)
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
  })

  it('validate answers with the rules their settings give', () => {
    const validator = createValidator(document, fieldKinds)
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
