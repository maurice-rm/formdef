import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { MultiComboboxField } from '@/components/formdef/multi-combobox-field'
import { hiddenValueInputs } from './helpers/no-hidden-value'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { multiCombobox: MultiComboboxField },
})

const OPTIONS = [
  { value: 'u_1', label: 'Ada Lovelace' },
  { value: 'u_2', label: 'Grace Hopper', description: 'No SSH key yet' },
  { value: 'u_3', label: 'Alan Turing', disabled: true },
]

const formWith = (memberIds: string[], props: Record<string, unknown> = {}) =>
  createForm({
    schema: z.object({ memberIds: z.array(z.string()).min(1, 'Choose a member') }),
    defaultValues: { memberIds },
    formId: 'project',
    validation: { mode: 'onSubmit' },
    fields: {
      memberIds: {
        widget: 'multiCombobox',
        props: {
          label: 'Members',
          description: 'Who works on it',
          placeholder: 'Search accounts',
          className: 'min-h-10',
          options: OPTIONS,
          ...props,
        },
      },
    },
    layout: [
      'memberIds',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.memberIds}>
            {(value) => <output aria-label="Stored members">{value.join(',')}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith([])

const input = (): HTMLInputElement => screen.getByRole('combobox', { name: 'Members' })
// A multiple combobox stays open after a pick, and Base UI hides the rest of the page from
// assistive tech while it is open.
const stored = (): string | null | undefined =>
  document.querySelector('output[aria-label="Stored members"]')?.textContent
const chips = (): (string | null)[] =>
  [...document.querySelectorAll('[data-slot="combobox-chip"]')].map((chip) => chip.textContent)

// jsdom delivers no pointer events, so the list opens from the keyboard; while it is open, Base UI
// hides the rest of the page from assistive tech, so the input is taken before opening.
const typeInto = (text: string): HTMLInputElement => {
  const control = input()
  fireEvent.keyDown(control, { key: 'ArrowDown' })
  fireEvent.change(control, { target: { value: text } })
  return control
}

afterEach(cleanup)

describeWiring({
  Form,
  control: input,
  id: 'project-memberIds',
  description: 'Who works on it',
  error: 'Choose a member',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('MultiComboboxField', () => {
  it('shows the labels of the stored options as chips', () => {
    const Chosen = formWith(['u_2', 'u_1'])
    render(<Chosen />)

    expect(chips()).toEqual(['Grace Hopper', 'Ada Lovelace'])
  })

  it('writes the value of an option picked from the list', async () => {
    const Chosen = formWith(['u_1'])
    render(<Chosen />)
    typeInto('')

    fireEvent.click(await screen.findByRole('option', { name: /Grace Hopper/ }))

    expect(stored()).toBe('u_1,u_2')
  })

  it('filters the options by their label', async () => {
    render(<Form />)
    typeInto('gra')

    expect(await screen.findByRole('option', { name: /Grace Hopper/ })).toBeDefined()
    expect(screen.queryByRole('option', { name: 'Ada Lovelace' })).toBeNull()
  })

  it('takes no free text on enter', () => {
    render(<Form />)
    const control = typeInto('zzz')

    fireEvent.keyDown(control, { key: 'Enter' })

    expect(stored()).toBe('')
    expect(chips()).toEqual([])
  })

  it('shows the description of an option below its label', async () => {
    render(<Form />)
    typeInto('')

    const option = await screen.findByRole('option', { name: /Grace Hopper/ })

    expect(option.textContent).toContain('No SSH key yet')
  })

  it('does not choose a disabled option', async () => {
    render(<Form />)
    typeInto('')

    fireEvent.click(await screen.findByRole('option', { name: 'Alan Turing' }))

    expect(stored()).toBe('')
  })

  it('removes an option through its named button, in words that can be replaced', () => {
    const German = formWith(['u_1', 'u_2'], {
      removeLabel: (option: { label: string }) => `${option.label} entfernen`,
    })
    render(<German />)

    fireEvent.click(screen.getByRole('button', { name: 'Grace Hopper entfernen' }))

    expect(stored()).toBe('u_1')
  })

  it('names the remove button "Remove <label>" by default', () => {
    const Chosen = formWith(['u_1'])
    render(<Chosen />)

    expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeDefined()
  })

  it('keeps a value the options do not carry, and shows it', () => {
    const Kept = formWith(['u_1', 'u_9'])
    render(<Kept />)

    expect(stored()).toBe('u_1,u_9')
    expect(chips()).toEqual(['Ada Lovelace', 'u_9'])
  })

  it('says when no option matches, in words that can be replaced', async () => {
    const German = formWith([], { empty: 'Kein Konto passt.' })
    render(<German />)

    typeInto('zzz')

    expect(await screen.findByText('Kein Konto passt.')).toBeDefined()
  })

  it('puts the class name on the chips and renders no hidden value', () => {
    const { container } = render(<Form />)

    expect(container.querySelector('[data-slot="combobox-chips"]')?.classList).toContain('min-h-10')
    expect(hiddenValueInputs(container)).toEqual([])
  })
})
