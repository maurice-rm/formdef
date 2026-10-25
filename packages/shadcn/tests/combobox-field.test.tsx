import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ComboboxField } from '@/components/formdef/combobox-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { combobox: ComboboxField },
})

const OPTIONS = [
  { value: 'next', label: 'Next.js' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'astro', label: 'Astro' },
]

const formWith = (framework: string, empty?: string, showClear = false) =>
  createForm({
    schema: z.object({ framework: z.string().min(1, 'Choose a framework') }),
    defaultValues: { framework },
    formId: 'stack',
    validation: { mode: 'onSubmit' },
    fields: {
      framework: {
        widget: 'combobox',
        props: {
          label: 'Framework',
          description: 'What the app is built with',
          placeholder: 'Search…',
          className: 'w-64',
          options: OPTIONS,
          showClear,
          ...(empty === undefined ? {} : { empty }),
        },
      },
    },
    layout: [
      'framework',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.framework}>
            {(value) => <output>{value}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith('')

const input = (): HTMLInputElement => screen.getByRole('combobox', { name: 'Framework' })

// jsdom delivers no pointer events, so the list opens from the keyboard; while it is open, Base UI
// hides the rest of the page from assistive tech, so the input is taken before opening.
const openList = (): HTMLInputElement => {
  const control = input()
  fireEvent.keyDown(control, { key: 'ArrowDown' })
  return control
}

afterEach(cleanup)

describeWiring({
  Form,
  control: input,
  id: 'stack-framework',
  description: 'What the app is built with',
  error: 'Choose a framework',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('ComboboxField', () => {
  it('shows its placeholder until an option is chosen', () => {
    render(<Form />)

    expect(input().placeholder).toBe('Search…')
    expect(input().value).toBe('')
  })

  it('writes the chosen option to the form and shows its label', async () => {
    render(<Form />)
    const control = openList()

    fireEvent.click(await screen.findByRole('option', { name: 'Nuxt' }))

    expect(control.value).toBe('Nuxt')
    expect(screen.getByRole('status').textContent).toBe('nuxt')
  })

  it('filters the options by what is typed', async () => {
    render(<Form />)
    const control = openList()

    fireEvent.change(control, { target: { value: 'as' } })

    expect(await screen.findByRole('option', { name: 'Astro' })).toBeDefined()
    expect(screen.queryByRole('option', { name: 'Nuxt' })).toBeNull()
  })

  it('says when nothing matches, in words that can be replaced', async () => {
    const German = formWith('', 'Nichts gefunden.')
    render(<German />)
    const control = openList()

    fireEvent.change(control, { target: { value: 'zzz' } })

    expect(await screen.findByText('Nichts gefunden.')).toBeDefined()
    expect(screen.queryByRole('option')).toBeNull()
  })

  it('says "No results." by default', async () => {
    render(<Form />)
    const control = openList()

    fireEvent.change(control, { target: { value: 'zzz' } })

    expect(await screen.findByText('No results.')).toBeDefined()
  })

  it('keeps a value the options do not carry, and shows it', () => {
    const Kept = formWith('svelte')
    render(<Kept />)

    expect(screen.getByRole('status').textContent).toBe('svelte')
    expect(input().value).toBe('svelte')
  })

  it('clears a value the options do not carry through its clear button', () => {
    const Kept = formWith('svelte', undefined, true)
    render(<Kept />)

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.getByRole('status').textContent).toBe('')
    expect(input().value).toBe('')
  })

  it('puts the class name on the input group it renders', () => {
    const { container } = render(<Form />)

    expect(container.querySelector('[data-slot="input-group"]')?.classList).toContain('w-64')
  })
})
