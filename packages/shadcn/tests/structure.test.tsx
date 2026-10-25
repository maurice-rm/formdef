import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ArrayFrame } from '@/components/formdef/array-frame'
import { Row } from '@/components/formdef/row'
import { Section } from '@/components/formdef/section'
import { TextField } from '@/components/formdef/text-field'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField },
  structure: { section: Section, row: Row, arrayFrame: ArrayFrame },
})

type Contact = { name: string; email: string }

const contactsSchema = z.object({
  contacts: z.array(z.object({ name: z.string(), email: z.string() })).min(2, 'Add at least two'),
})

const contactsForm = (
  contacts: Contact[],
  props: Record<string, unknown> = {},
  mode: 'onSubmit' | 'onChange' = 'onSubmit',
) =>
  createForm({
    schema: contactsSchema,
    defaultValues: { contacts },
    formId: 'team',
    validation: { mode },
    fields: {
      contacts: {
        item: {
          fields: {
            name: { widget: 'text', props: { label: 'Name' } },
            email: { widget: 'text', props: { label: 'Email' } },
          },
        },
        newItem: () => ({ name: '', email: '' }),
        addLabel: 'Add contact',
        removeLabel: (contact: Contact, index: number) => `Remove ${contact.name || index + 1}`,
        props: { label: 'Contacts', description: 'Who we may call', className: 'gap-6', ...props },
      },
    },
  })

const ADA = { name: 'Ada', email: 'ada@example.com' }
const GRACE = { name: 'Grace', email: 'grace@example.com' }

afterEach(cleanup)

describe('Section', () => {
  const Form = createForm({
    schema: z.object({ name: z.string() }),
    defaultValues: { name: '' },
    fields: { name: { widget: 'text', props: { label: 'Name' } } },
    layout: [
      {
        section: 'About you',
        props: { description: 'As it appears on your ID', variant: 'label', className: 'mt-4' },
        layout: ['name'],
      },
    ],
  })

  it('renders a fieldset named by its legend, with its description and fields', () => {
    render(<Form />)
    const section = screen.getByRole('group', { name: 'About you' })

    expect(section.tagName).toBe('FIELDSET')
    expect(section.getAttribute('aria-describedby')).toBe(
      screen.getByText('As it appears on your ID').id,
    )
    expect(section.classList).toContain('mt-4')
    expect(within(section).getByText('As it appears on your ID')).toBeDefined()
    expect(within(section).getByLabelText('Name')).toBeDefined()
    expect(within(section).getByText('About you').getAttribute('data-variant')).toBe('label')
  })
})

describe('Row', () => {
  const Form = createForm({
    schema: z.object({ first: z.string(), last: z.string() }),
    defaultValues: { first: '', last: '' },
    fields: {
      first: { widget: 'text', props: { label: 'First name' } },
      last: { widget: 'text', props: { label: 'Last name' } },
    },
    layout: [{ row: ['first', 'last'], props: { className: 'gap-6' } }],
  })

  it('places its fields in a row inside a container of its own', () => {
    const { container } = render(<Form />)
    const row = container.querySelector('[data-slot="field-row"]')

    expect(row?.classList).toContain('gap-6')
    expect(row?.parentElement?.className).toContain('@container')
    expect(row?.querySelectorAll('input')).toHaveLength(2)
  })
})

describe('ArrayFrame', () => {
  it('renders the items in a fieldset named by its label, with its description', () => {
    const Form = contactsForm([ADA])
    render(<Form />)
    const frame = screen.getByRole('group', { name: 'Contacts' })

    expect(frame.classList).toContain('gap-6')
    expect(within(frame).getByText('Who we may call')).toBeDefined()
    expect(within(frame).getAllByLabelText('Name')).toHaveLength(1)
  })

  it('adds an item and removes the item of each named button, whatever its shape', () => {
    const Form = contactsForm([ADA, GRACE])
    render(<Form />)

    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))
    expect(screen.getAllByLabelText('Name')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Ada' }))
    expect(screen.getAllByLabelText<HTMLInputElement>('Name').map((input) => input.value)).toEqual([
      'Grace',
      '',
    ])
  })

  it('disables removing at min and adding at max', () => {
    const Bounded = contactsForm([ADA, GRACE], { min: 2, max: 2 })
    render(<Bounded />)

    expect(screen.getByRole('button', { name: 'Remove Ada' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Add contact' })).toHaveProperty('disabled', true)
  })

  it('ties its description to the group', () => {
    const Form = contactsForm([ADA])
    render(<Form />)

    expect(screen.getByRole('group', { name: 'Contacts' }).getAttribute('aria-describedby')).toBe(
      'team-contacts-description',
    )
    expect(screen.getByText('Who we may call').id).toBe('team-contacts-description')
  })

  it('holds back an error about the whole list until it is due', () => {
    const Early = contactsForm([ADA, GRACE], {}, 'onChange')
    render(<Early />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Ada' }))

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('moves the focus to the next remove button, or to the add button after the last item', () => {
    const Form = contactsForm([ADA, GRACE])
    render(<Form />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Ada' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Grace' }))

    fireEvent.click(screen.getByRole('button', { name: 'Remove Grace' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add contact' }))
  })

  it('shows an error about the whole list inside the frame', async () => {
    const Form = contactsForm([ADA])
    render(<Form />)

    fireEvent.submit(
      screen.getByRole('group', { name: 'Contacts' }).closest('form') as HTMLFormElement,
    )

    const alert = await screen.findByRole('alert')
    const frame = screen.getByRole('group', { name: 'Contacts' })
    expect(alert.textContent).toBe('Add at least two')
    expect(frame.contains(alert)).toBe(true)
    expect(frame.getAttribute('aria-invalid')).toBe('true')
    expect(frame.getAttribute('aria-describedby')).toBe(
      'team-contacts-description team-contacts-error',
    )
    expect(alert.id).toBe('team-contacts-error')
  })
})
