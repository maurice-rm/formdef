import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { TagsField } from '@/components/formdef/tags-field'
import { hiddenValueInputs } from './helpers/no-hidden-value'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({ fieldContext, formContext, widgets: { tags: TagsField } })

const formWith = (skills: string[], props: Record<string, unknown> = {}) =>
  createForm({
    schema: z.object({ skills: z.array(z.string()).min(2, 'Name at least two') }),
    defaultValues: { skills },
    formId: 'profile',
    validation: { mode: 'onSubmit' },
    fields: {
      skills: {
        widget: 'tags',
        props: {
          label: 'Skills',
          description: 'Anything you can name',
          placeholder: 'Add one…',
          className: 'min-h-10',
          suggestions: ['typescript', 'svelte'],
          ...props,
        },
      },
    },
    layout: [
      'skills',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.skills}>
            {(value) => <output aria-label="Stored skills">{value.join(',')}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith(['react'])

const input = (): HTMLInputElement => screen.getByRole('combobox', { name: 'Skills' })
const stored = (): string | null =>
  screen.getByRole('status', { name: 'Stored skills' }).textContent
const chips = (): (string | null)[] =>
  [...document.querySelectorAll('[data-slot="combobox-chip"]')].map((chip) => chip.textContent)

// jsdom delivers no pointer events, so the list opens from the keyboard; while it is open, Base UI
// hides the rest of the page from assistive tech, so the input is taken before opening.
const typeInto = (text: string, isOpening = true): HTMLInputElement => {
  const control = input()
  if (isOpening) {
    fireEvent.keyDown(control, { key: 'ArrowDown' })
  }
  fireEvent.change(control, { target: { value: text } })
  return control
}

const pressEnter = (control: HTMLElement): void => {
  fireEvent.keyDown(control, { key: 'Enter' })
}

afterEach(cleanup)

describeWiring({
  Form,
  control: input,
  id: 'profile-skills',
  description: 'Anything you can name',
  error: 'Name at least two',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('TagsField', () => {
  it('shows the stored tags as chips', () => {
    render(<Form />)

    expect(chips()).toEqual(['react'])
  })

  it('turns the typed text into a tag on enter, trimmed, and empties the input', () => {
    render(<Form />)
    const control = typeInto('  graphql  ', false)

    pressEnter(control)

    expect(stored()).toBe('react,graphql')
    expect(control.value).toBe('')
  })

  it('does not add a tag twice', () => {
    render(<Form />)
    const control = typeInto('react', false)

    pressEnter(control)

    expect(stored()).toBe('react')
  })

  it('adds a suggestion picked from the list', async () => {
    render(<Form />)
    typeInto('sv')

    fireEvent.click(await screen.findByRole('option', { name: 'svelte' }))

    expect(stored()).toBe('react,svelte')
  })

  it('takes a highlighted suggestion over the typed text', async () => {
    render(<Form />)
    const control = typeInto('sv')

    await screen.findByRole('option', { name: 'svelte' })
    fireEvent.keyDown(control, { key: 'ArrowDown' })
    pressEnter(control)

    expect(stored()).toBe('react,svelte')
  })

  it('does not offer a suggestion that is already a tag', async () => {
    const Both = formWith(['react', 'svelte'])
    render(<Both />)
    typeInto('')

    expect(await screen.findByRole('option', { name: 'typescript' })).toBeDefined()
    expect(screen.queryByRole('option', { name: 'svelte' })).toBeNull()
  })

  it('removes a tag through its named button, in words that can be replaced', () => {
    const German = formWith(['react', 'vue'], { removeLabel: (tag: string) => `${tag} entfernen` })
    render(<German />)

    fireEvent.click(screen.getByRole('button', { name: 'vue entfernen' }))

    expect(stored()).toBe('react')
  })

  it('names the remove button "Remove <tag>" by default', () => {
    render(<Form />)

    expect(screen.getByRole('button', { name: 'Remove react' })).toBeDefined()
  })

  it('opens no list without suggestions, and still takes what is typed', () => {
    const Free = formWith([], { suggestions: [] })
    render(<Free />)
    const control = typeInto('anything')

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(control.getAttribute('aria-expanded')).not.toBe('true')
    pressEnter(control)
    expect(stored()).toBe('anything')
  })

  it('says when no suggestion matches, in words that can be replaced', async () => {
    const German = formWith([], { empty: 'Nichts gefunden.' })
    render(<German />)

    typeInto('zzz')

    expect(await screen.findByText('Nichts gefunden.')).toBeDefined()
  })

  it('leaves enter to the form when nothing is typed', () => {
    render(<Form />)

    const isDefaultKept = fireEvent.keyDown(input(), { key: 'Enter' })

    expect(isDefaultKept).toBe(true)
  })

  it('makes no tag from enter with a modifier or while composing', () => {
    render(<Form />)
    const control = typeInto('graphql', false)

    fireEvent.keyDown(control, { key: 'Enter', shiftKey: true })
    fireEvent.keyDown(control, { key: 'Enter', isComposing: true })

    expect(stored()).toBe('react')
  })

  it('puts the class name on the chips and renders no hidden value', () => {
    const { container } = render(<Form />)

    expect(container.querySelector('[data-slot="combobox-chips"]')?.classList).toContain('min-h-10')
    expect(hiddenValueInputs(container)).toEqual([])
  })
})
