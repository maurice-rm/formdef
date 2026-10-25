import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { CheckboxGroupField } from '@/components/formdef/checkbox-group-field'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { checkboxes: CheckboxGroupField },
})

const OPTIONS = [
  { value: 'description', label: 'Email', description: 'A weekly digest' },
  { value: 'a b', label: 'SMS' },
  { value: 'push', label: 'Push' },
]

const formWith = (channels: string[], mode: 'onSubmit' | 'onBlur' = 'onSubmit') =>
  createForm({
    schema: z.object({ channels: z.array(z.string()).min(1, 'Choose a channel') }),
    defaultValues: { channels },
    formId: 'settings',
    validation: { mode },
    fields: {
      channels: {
        widget: 'checkboxes',
        props: {
          label: 'Channels',
          description: 'How we reach you',
          className: 'size-5',
          options: OPTIONS,
        },
      },
    },
    layout: [
      'channels',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.channels}>
            {(value) => <output>{value.join(',')}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith([])

const group = (): HTMLElement => screen.getByRole('group', { name: 'Channels' })
const box = (name: string): HTMLElement => screen.getByRole('checkbox', { name })
const values = (): string | null => screen.getByRole('status').textContent

afterEach(cleanup)

describe('CheckboxGroupField', () => {
  it('names the group by its legend and ties the description to it', () => {
    render(<Form />)

    expect(group().getAttribute('aria-describedby')).toBe('settings-channels-description')
    expect(screen.getByText('How we reach you').id).toBe('settings-channels-description')
  })

  it('names and describes every option, with ids that cannot collide', () => {
    render(<Form />)

    expect(document.getElementById('settings-channels-option-a%20b')).not.toBeNull()
    expect(document.getElementById('settings-channels-option-description')).not.toBeNull()
    expect(box('Email').getAttribute('aria-describedby')).toBe(
      'settings-channels-option-description-description',
    )
    expect(screen.getByText('A weekly digest').id).toBe(
      'settings-channels-option-description-description',
    )
  })

  it('marks nothing before a submit, and announces the error after it', async () => {
    render(<Form />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(box('Email').getAttribute('aria-invalid')).toBeNull()

    fireEvent.submit(group().closest('form') as HTMLFormElement)

    expect((await screen.findByRole('alert')).textContent).toBe('Choose a channel')
    expect(box('Email').getAttribute('aria-invalid')).toBe('true')
    expect(box('Email').getAttribute('aria-errormessage')).toBe('settings-channels-error')
  })

  it('adds and removes the value of the box clicked', () => {
    render(<Form />)

    fireEvent.click(box('Push'))
    fireEvent.click(box('Email'))
    expect(values()).toBe('push,description')

    fireEvent.click(box('Push'))
    expect(values()).toBe('description')
  })

  it('keeps values the options do not carry, in their order', () => {
    const Kept = formWith(['fax', 'push', 'pager'])
    render(<Kept />)

    fireEvent.click(box('SMS'))
    expect(values()).toBe('fax,push,pager,a b')

    fireEvent.click(box('Push'))
    expect(values()).toBe('fax,pager,a b')
  })

  it('reports a blur only when the focus leaves the group', async () => {
    const Strict = formWith(['push'], 'onBlur')
    render(<Strict />)

    fireEvent.click(box('Push'))
    fireEvent.blur(box('Push'), { relatedTarget: box('SMS') })
    expect(screen.queryByRole('alert')).toBeNull()

    fireEvent.blur(box('Push'), { relatedTarget: document.body })
    expect((await screen.findByRole('alert')).textContent).toBe('Choose a channel')
  })

  it('puts the class name on every checkbox', () => {
    render(<Form />)

    expect(box('Email').classList).toContain('size-5')
    expect(box('Push').classList).toContain('size-5')
  })
})
