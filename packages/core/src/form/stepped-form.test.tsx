import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { StepperProps } from '../config/structure'
import { Fields } from '../render/fields'
import type { FieldOf } from '../widget/field-of'
import { createForm } from './create-form'

const { fieldContext, formContext } = createFormHookContexts()

const TextField = ({
  field,
  label,
  required,
}: FieldOf<string> & { label: string; required?: boolean }): ReactNode => (
  <label>
    {label}
    <input
      name={field.name}
      required={required}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
    />
  </label>
)
TextField.emptyValue = ''

const Stepper = ({
  steps,
  current,
  next,
  back,
  goTo,
  isFirst,
  isLast,
  isSubmitting,
  children,
}: StepperProps): ReactNode => (
  <section aria-label="Stepper" data-submitting={String(isSubmitting)}>
    <ol>
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={step.isCurrent ? 'step' : undefined}
          data-visited={String(step.isVisited)}
          data-reachable={String(step.isReachable)}
          data-due-error={String(step.hasDueError)}
        >
          <button type="button" onClick={() => goTo(index)}>{`Go to ${step.label}`}</button>
        </li>
      ))}
    </ol>
    <output aria-label="Current">{current}</output>
    {children}
    <button type="button" onClick={back} disabled={isFirst}>
      Back
    </button>
    <button type="button" onClick={next}>
      {isLast ? 'Submit' : 'Next'}
    </button>
  </section>
)

const widgets = { text: TextField }
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: widgets,
  formComponents: {},
})
const BINDING = {
  useAppForm,
  parts: { widgets, formComponents: {}, structure: { stepper: Stepper } },
}
const BINDING_WITHOUT_STEPPER = {
  useAppForm,
  parts: { widgets, formComponents: {}, structure: {} },
}

const schema = z.object({
  contact: z.object({ name: z.string().min(1, 'Enter a name') }),
  building: z.object({ city: z.string() }),
  heating: z.object({ kind: z.string().min(1, 'Enter a kind') }),
})

const DEFAULT_VALUES = { contact: { name: '' }, building: { city: '' }, heating: { kind: '' } }

const FIELDS = {
  contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } },
  building: { fields: { city: { widget: 'text', props: { label: 'City' } } } },
  heating: { fields: { kind: { widget: 'text', props: { label: 'Kind' } } } },
}

const STEPS = [
  { step: 'contact', label: 'Contact' },
  { step: 'building', label: 'Building' },
  { step: 'heating', label: 'Heating' },
]

const checklistConfig = (rest: Record<string, unknown> = {}): Record<string, unknown> => ({
  schema,
  defaultValues: DEFAULT_VALUES,
  fields: FIELDS,
  layout: STEPS,
  ...rest,
})

const MODES = ['revalidate', 'blurThenChange', 'onChange', 'onBlur', 'onSubmit'] as const

const click = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

const type = async (label: string, value: string): Promise<void> => {
  await act(async () => {
    const input = screen.getByLabelText(label)
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  })
}

const currentStep = (): string | null =>
  screen.getByRole('listitem', { current: 'step' }).textContent

const stepItem = (label: string): HTMLElement =>
  screen.getByRole('button', { name: `Go to ${label}` }).closest('li') as HTMLElement

const StepsUnderFields = (): ReactNode => {
  const form = useAppForm({ defaultValues: DEFAULT_VALUES })

  return <Fields parts={BINDING_WITHOUT_STEPPER.parts} form={form} fields={FIELDS} layout={STEPS} />
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('createForm with steps', () => {
  it('renders the first step only, inside the registered stepper', () => {
    const Checklist = createForm(BINDING, checklistConfig())
    render(<Checklist />)

    expect(screen.getByRole('region', { name: 'Stepper' })).toBeDefined()
    expect(screen.getByLabelText('Name')).toBeDefined()
    expect(screen.queryByLabelText('City')).toBeNull()
    expect(currentStep()).toBe('Go to Contact')
    expect(screen.getByRole('button', { name: 'Back' })).toHaveProperty('disabled', true)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  for (const mode of MODES) {
    describe(`with validation mode ${mode}`, () => {
      it('stays on a step its schema rejects and moves on once it is valid', async () => {
        const Checklist = createForm(BINDING, checklistConfig({ validation: { mode } }))
        render(<Checklist />)

        await click('Next')
        expect(currentStep()).toBe('Go to Contact')

        await type('Name', 'Ada')
        await click('Next')
        expect(currentStep()).toBe('Go to Building')
        expect(screen.getByLabelText('City')).toBeDefined()
      })

      it('submits the form from the last step', async () => {
        const onSubmit = vi.fn()
        const Checklist = createForm(
          BINDING,
          checklistConfig({
            validation: { mode },
            defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
            onSubmit: ({ value }: { value: unknown }) => onSubmit(value),
          }),
        )
        render(<Checklist />)

        await click('Next')
        await click('Next')
        await type('Kind', 'gas')
        await click('Submit')

        expect(onSubmit).toHaveBeenCalledWith({
          contact: { name: 'Ada' },
          building: { city: '' },
          heating: { kind: 'gas' },
        })
      })
    })
  }

  it('moves on, not submits, when the form element is submitted on a step before the last', async () => {
    const onSubmit = vi.fn()
    const Checklist = createForm(
      BINDING,
      checklistConfig({ defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } }, onSubmit }),
    )
    render(<Checklist aria-label="Checklist" />)

    await act(async () => {
      fireEvent.submit(screen.getByRole('form'))
    })

    expect(currentStep()).toBe('Go to Building')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('keeps the values of a step while another one is shown', async () => {
    const Checklist = createForm(BINDING, checklistConfig())
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await click('Back')

    expect(currentStep()).toBe('Go to Contact')
    expect(screen.getByLabelText('Name')).toHaveProperty('value', 'Ada')
  })

  it('goes to a visited step while every step before it is valid, and nowhere else', async () => {
    const Checklist = createForm(BINDING, checklistConfig())
    render(<Checklist />)

    expect(stepItem('Building').dataset.reachable).toBe('false')
    await click('Go to Building')
    expect(currentStep()).toBe('Go to Contact')

    await type('Name', 'Ada')
    await click('Next')
    await click('Back')
    expect(stepItem('Building').dataset.visited).toBe('true')
    expect(stepItem('Building').dataset.reachable).toBe('true')

    await type('Name', '')
    await click('Next')
    expect(stepItem('Building').dataset.reachable).toBe('false')
    await click('Go to Building')
    expect(currentStep()).toBe('Go to Contact')
  })

  it('marks a step whose errors are due once it was submitted', async () => {
    const Checklist = createForm(BINDING, checklistConfig())
    render(<Checklist />)

    expect(stepItem('Contact').dataset.dueError).toBe('false')
    await click('Next')
    expect(stepItem('Contact').dataset.dueError).toBe('true')

    await type('Name', 'Ada')
    expect(stepItem('Contact').dataset.dueError).toBe('false')
  })

  it('marks a step whose field was edited and left invalid, as its widget shows it', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        validation: { mode: 'onBlur' },
        defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
      }),
    )
    render(<Checklist />)

    await type('Name', '')

    expect(stepItem('Contact').dataset.dueError).toBe('true')
  })

  it('stays on the step chosen while a step before it was still being submitted', async () => {
    let settle: () => void = () => undefined
    const pending = new Promise<undefined>((resolve) => {
      settle = () => resolve(undefined)
    })
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
        fields: {
          ...FIELDS,
          building: {
            fields: {
              city: {
                ...FIELDS.building.fields.city,
                validators: { onSubmitAsync: () => pending },
              },
            },
          },
        },
      }),
    )
    render(<Checklist />)

    await click('Next')
    await click('Next')
    expect(currentStep()).toBe('Go to Building')
    await click('Back')
    await act(async () => {
      settle()
      await pending
    })

    expect(currentStep()).toBe('Go to Contact')
  })

  it('skips a step its condition hides, forward and back', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: [
          STEPS[0],
          {
            ...STEPS[1],
            visibleWhen: (values: typeof DEFAULT_VALUES) => values.contact.name !== 'Ada',
          },
          STEPS[2],
        ],
      }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    await click('Next')
    expect(currentStep()).toBe('Go to Heating')
    expect(screen.getByLabelText('Current').textContent).toBe('1')
    await click('Back')
    expect(currentStep()).toBe('Go to Contact')
  })

  it('tells a widget in a step that its field is required', () => {
    const Checklist = createForm(BINDING, checklistConfig())
    render(<Checklist />)

    expect(screen.getByLabelText('Name')).toHaveProperty('required', true)
  })

  it('throws for a root layout that mixes steps with other entries', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Checklist = createForm(BINDING, checklistConfig({ layout: [STEPS[0], 'building'] }))

    expect(() => render(<Checklist />)).toThrow(
      'formdef: the root layout holds a step and other entries; a root layout that holds a step holds only steps.',
    )
  })

  it('throws for a step without a registered stepper', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Checklist = createForm(BINDING_WITHOUT_STEPPER, checklistConfig())

    expect(() => render(<Checklist />)).toThrow(
      'formdef: the form has steps, but no structure.stepper is registered.',
    )
  })

  it('throws for a step that names no entry with fields', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({ fields: { ...FIELDS, building: { render: () => null } } }),
    )

    expect(() => render(<Checklist />)).toThrow(
      'formdef: the step "building" names no entry of the root level with fields.',
    )
  })

  it('throws for a step below the root layout', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: undefined,
        fields: { contact: { ...FIELDS.contact, layout: [{ step: 'name', label: 'Name' }] } },
      }),
    )

    expect(() => render(<Checklist />)).toThrow(
      'formdef: the layout of "contact" holds a step; a step is an entry of the root layout of a form only.',
    )
  })

  it('throws for a step under Fields', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<StepsUnderFields />)).toThrow(
      'formdef: the layout of the form holds a step; a step is an entry of the root layout of a form only.',
    )
  })
})
