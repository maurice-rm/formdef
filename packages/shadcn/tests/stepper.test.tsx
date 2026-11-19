import { createRegistry, type StepperProps } from '@formdef/core'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { Stepper, type StepperStepProps } from '@/components/formdef/stepper'
import { TextField } from '@/components/formdef/text-field'
import { fieldContext, formContext } from '@/lib/formdef/context'

const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField },
  structure: { stepper: Stepper },
})

const schema = z.object({
  contact: z.object({ name: z.string().min(1, 'Enter a name') }),
  heating: z.object({ kind: z.string() }),
})

type StepperOptions = Omit<Parameters<typeof Stepper>[0], keyof StepperProps>

const registryWith = (options: StepperOptions) =>
  createRegistry({
    fieldContext,
    formContext,
    widgets: { text: TextField },
    structure: {
      stepper: (props: StepperProps<StepperStepProps>) => <Stepper {...props} {...options} />,
    },
  })

const fields = {
  contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } },
  heating: { fields: { kind: { widget: 'text', props: { label: 'Kind' } } } },
} as const

const checklistWith = (options: StepperOptions) =>
  registryWith(options).createForm({
    schema,
    defaultValues: { contact: { name: '' }, heating: { kind: '' } },
    fields,
    layout: [
      { step: 'contact', label: 'Contact', props: { description: 'How we reach you' } },
      { step: 'heating', label: 'Heating' },
    ],
  })

const checklist = (onSubmit = vi.fn()) =>
  createForm({
    schema,
    defaultValues: { contact: { name: '' }, heating: { kind: '' } },
    fields: {
      contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } },
      heating: { fields: { kind: { widget: 'text', props: { label: 'Kind' } } } },
    },
    layout: [
      { step: 'contact', label: 'Contact' },
      { step: 'heating', label: 'Heating' },
    ],
    onSubmit,
  })

const click = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

const Translated = ({ children, ...props }: Parameters<typeof Stepper>[0]) => (
  <Stepper
    {...props}
    backLabel="Zurück"
    nextLabel="Weiter"
    submitLabel="Absenden"
    progressLabel={(step, total) => `Schritt ${step} von ${total}`}
  >
    {children}
  </Stepper>
)

afterEach(cleanup)

describe('Stepper', () => {
  it('names the current step in a heading and lists the steps with the current one marked', () => {
    const Checklist = checklist()
    render(<Checklist />)

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeDefined()
    expect(screen.getByText('Step 1 of 2')).toBeDefined()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]?.querySelector('[aria-current="step"]')).not.toBeNull()
    expect(items[1]?.dataset.state).toBe('upcoming')
  })

  it('shows how far the person is as a named progress bar in the compact variant', () => {
    const Checklist = checklistWith({ variant: 'compact' })
    render(<Checklist />)

    const progress = screen.getByRole('progressbar', { name: 'Step 1 of 2' })
    expect(progress.getAttribute('aria-valuenow')).toBe('1')
    expect(progress.getAttribute('aria-valuemax')).toBe('2')
    expect(progress.getAttribute('aria-valuetext')).toBe('Step 1 of 2')
    expect(screen.getByText('Up next: Heating')).toBeDefined()
  })

  it('shows the description a step entry passes, under the heading and in the list', () => {
    const Checklist = checklistWith({})
    render(<Checklist />)

    expect(screen.getAllByText('How we reach you')).toHaveLength(2)
  })

  it('leaves out the descriptions and the heading when told to, keeping the heading for assistive technology', () => {
    const Checklist = checklistWith({ showDescriptions: false, showHeading: false })
    render(<Checklist />)

    expect(screen.getByRole('heading', { name: 'Contact' }).className).toContain('sr-only')
    expect(screen.queryByText('How we reach you', { selector: 'p' })).toBeNull()
  })

  it('reserves no block for a heading with nothing to show, and still moves the focus to it', async () => {
    const Checklist = checklistWith({ showHeading: false, showProgress: false })
    const { container } = render(<Checklist />)

    expect(container.querySelector('[data-slot=stepper-heading]')).toBeNull()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } })
    await click('Next')

    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Heating' }))
  })

  it('keeps the progress in the heading block when only the heading is hidden', () => {
    const Checklist = checklistWith({ showHeading: false })
    const { container } = render(<Checklist />)

    const heading = container.querySelector('[data-slot=stepper-heading]')
    expect(heading?.textContent).toBe('Step 1 of 2')
  })

  it('ticks a complete step, names it so and goes back to it', async () => {
    const Checklist = checklist()
    render(<Checklist />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } })
    await click('Next')
    await click('Contact, Complete')

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeDefined()
  })

  it('offers no way to a step through the list when it is not navigable', async () => {
    const Checklist = checklistWith({ navigable: false })
    render(<Checklist />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } })
    await click('Next')

    expect(screen.queryByRole('button', { name: 'Contact, Complete' })).toBeNull()
  })

  it('shows a due error of the current step in the compact variant', async () => {
    const Checklist = checklistWith({ variant: 'compact' })
    render(<Checklist />)

    expect(screen.queryByText(', Has errors')).toBeNull()
    await click('Next')

    expect(screen.getByText(', Has errors')).toBeDefined()
    expect(
      document.querySelector('[data-slot="stepper-compact"]')?.getAttribute('data-state'),
    ).toBe('error')
  })

  it('names a step whose errors are due', async () => {
    const Checklist = checklist()
    render(<Checklist />)

    await click('Next')

    expect(screen.getByText(', Has errors')).toBeDefined()
    expect(screen.getAllByRole('listitem')[0]?.dataset.state).toBe('error')
  })

  it('offers no way back on the first step and a submit on the last', async () => {
    const onSubmit = vi.fn()
    const Checklist = checklist(onSubmit)
    render(<Checklist />)

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } })
    await click('Next')

    expect(screen.getByRole('heading', { name: 'Heating' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDefined()
    await click('Submit')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('moves on when Enter submits a field of a step', async () => {
    const Checklist = checklist()
    render(<Checklist />)

    const name = screen.getByLabelText('Name')
    fireEvent.change(name, { target: { value: 'Ada' } })
    await act(async () => {
      fireEvent.submit(name.closest('form') as HTMLFormElement)
    })

    expect(screen.getByRole('heading', { name: 'Heating' })).toBeDefined()
  })

  it('moves the focus to the heading of the step it moves to, not on the first one', async () => {
    const Checklist = checklist()
    render(<Checklist />)

    expect(document.activeElement).toBe(document.body)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } })
    await click('Next')

    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Heating' }))
  })

  it('leaves the focus on the first invalid control when a step stays', async () => {
    const Checklist = checklist()
    render(<Checklist />)

    await click('Next')

    expect(document.activeElement).toBe(screen.getByLabelText('Name'))
  })

  it('keeps the focus in a field when a step before it shows or hides', async () => {
    const Checklist = createForm({
      schema: z.object({
        intro: z.object({ note: z.string() }),
        contact: z.object({ name: z.string() }),
        heating: z.object({ kind: z.string() }),
      }),
      defaultValues: { intro: { note: '' }, contact: { name: '' }, heating: { kind: '' } },
      fields: {
        intro: { fields: { note: { widget: 'text', props: { label: 'Note' } } } },
        contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } },
        heating: { fields: { kind: { widget: 'text', props: { label: 'Kind' } } } },
      },
      layout: [
        {
          step: 'intro',
          label: 'Intro',
          visibleWhen: (values) => values.contact.name !== 'skip intro',
        },
        { step: 'contact', label: 'Contact' },
        { step: 'heating', label: 'Heating' },
      ],
    })
    render(<Checklist />)
    await click('Next')

    const name = screen.getByLabelText('Name')
    name.focus()
    await act(async () => {
      fireEvent.change(name, { target: { value: 'skip intro' } })
    })

    expect(screen.getByText('Step 1 of 2')).toBeDefined()
    expect(document.activeElement).toBe(name)
  })

  it('submits once while a submit is running', async () => {
    let settle: () => void = () => undefined
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve
        }),
    )
    const Checklist = checklist(onSubmit)
    render(<Checklist />)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } })
    await click('Next')

    await click('Submit')
    await click('Submit')
    await act(async () => {
      settle()
    })

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('takes its texts as props', () => {
    const { createForm: createTranslatedForm } = createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      structure: { stepper: Translated },
    })
    const Checklist = createTranslatedForm({
      schema,
      defaultValues: { contact: { name: '' }, heating: { kind: '' } },
      fields: {
        contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } },
        heating: { fields: { kind: { widget: 'text', props: { label: 'Kind' } } } },
      },
      layout: [
        { step: 'contact', label: 'Kontakt' },
        { step: 'heating', label: 'Heizung' },
      ],
    })
    render(<Checklist />)

    expect(screen.getByText('Schritt 1 von 2')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeDefined()
  })
})
