import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { SelectField } from '@/components/formdef/select-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { select: SelectField },
})

const OPTIONS = [
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France', disabled: true },
]

const formWith = (country: string) =>
  createForm({
    schema: z.object({ country: z.string().min(1, 'Choose a country') }),
    defaultValues: { country },
    formId: 'billing',
    validation: { mode: 'onSubmit' },
    fields: {
      country: {
        widget: 'select',
        props: {
          label: 'Country',
          description: 'Where you are billed',
          placeholder: 'Choose…',
          className: 'w-48',
          options: OPTIONS,
        },
      },
    },
    layout: [
      'country',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.country}>
            {(value) => <output>{value}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith('')

const trigger = (): HTMLElement => screen.getByRole('combobox', { name: 'Country' })

afterEach(cleanup)

describeWiring({
  Form,
  control: trigger,
  id: 'billing-country',
  description: 'Where you are billed',
  error: 'Choose a country',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('SelectField', () => {
  it('shows its placeholder until an option is chosen', () => {
    render(<Form />)

    expect(trigger().textContent).toContain('Choose…')
  })

  it('writes the chosen option to the form', async () => {
    render(<Form />)

    fireEvent.click(trigger())
    fireEvent.click(await screen.findByRole('option', { name: 'Germany' }))

    expect(screen.getByRole('status').textContent).toBe('de')
  })

  it('keeps a value the options do not carry, and shows it', () => {
    const Kept = formWith('ch')
    render(<Kept />)

    expect(screen.getByRole('status').textContent).toBe('ch')
    expect(trigger().textContent).toContain('ch')
    expect(trigger().textContent).not.toContain('Choose…')
  })

  it('puts the class name on the trigger', () => {
    render(<Form />)

    expect(trigger().classList).toContain('w-48')
  })
})
