import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { StepperProps } from '../config/structure'
import { Fields } from '../render/fields'
import type { FieldOf } from '../widget/field-of'
import { useFieldParts } from '../widget/use-field-parts'
import { createForm } from './create-form'

const { fieldContext, formContext } = createFormHookContexts()

const TextField = ({
  field,
  label,
  required,
}: FieldOf<string> & { label: string; required?: boolean }): ReactNode => {
  const { control, errorId, isErrorDue, errors } = useFieldParts(field)

  return (
    <div>
      <label htmlFor={control.id}>{label}</label>
      <input
        {...control}
        required={required}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {isErrorDue && <p id={errorId}>{errors.join(' ')}</p>}
    </div>
  )
}
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
  variant,
}: StepperProps<{ description?: string }> & { variant?: string }): ReactNode => (
  <section aria-label="Stepper" data-submitting={String(isSubmitting)} data-variant={variant}>
    <ol>
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={step.isCurrent ? 'step' : undefined}
          data-visited={String(step.isVisited)}
          data-reachable={String(step.isReachable)}
          data-complete={String(step.isComplete)}
          data-due-error={String(step.hasDueError)}
          data-description={step.description}
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

const strictSchema = z.object({
  contact: z.object({ name: z.string().min(1, 'Enter a name') }),
  building: z.object({ city: z.string().min(1, 'Enter a city') }),
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

  it('marks a step complete once next checked it and none of its fields holds an error', async () => {
    const Checklist = createForm(BINDING, checklistConfig())
    render(<Checklist />)

    expect(stepItem('Contact').dataset.complete).toBe('false')
    await click('Next')
    expect(stepItem('Contact').dataset.complete).toBe('false')

    await type('Name', 'Ada')
    expect(stepItem('Contact').dataset.complete).toBe('true')

    await click('Next')
    expect(stepItem('Building').dataset.complete).toBe('false')
    await click('Back')
    expect(stepItem('Building').dataset.visited).toBe('true')
    expect(stepItem('Building').dataset.complete).toBe('false')

    await type('Name', '')
    await click('Next')
    expect(stepItem('Contact').dataset.complete).toBe('false')
  })

  it('counts a submit of the form as a check of a step next never reached', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: [
          { step: 'contact', label: 'Contact' },
          {
            step: 'building',
            label: 'Building',
            visibleWhen: (values: typeof DEFAULT_VALUES) => values.heating.kind !== '',
          },
          { step: 'heating', label: 'Heating' },
        ],
      }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await type('Kind', 'Gas')
    expect(stepItem('Building').dataset.complete).toBe('false')

    await click('Submit')
    expect(stepItem('Building').dataset.complete).toBe('true')
  })

  for (const mode of MODES) {
    it(`marks a valid step complete once next leaves it, with validation mode ${mode}`, async () => {
      const Checklist = createForm(BINDING, checklistConfig({ validation: { mode } }))
      render(<Checklist />)

      await type('Name', 'Ada')
      await click('Next')

      expect(currentStep()).toBe('Go to Building')
      expect(stepItem('Contact').dataset.complete).toBe('true')
    })
  }

  it('passes the props of each step entry flat on its state', () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: [{ ...STEPS[0], props: { description: 'How we reach you' } }, STEPS[1], STEPS[2]],
      }),
    )
    render(<Checklist />)

    expect(stepItem('Contact').dataset.description).toBe('How we reach you')
    expect(stepItem('Building').dataset.description).toBeUndefined()
  })

  it("passes the config's stepper props to the stepper", () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({ stepper: { props: { variant: 'rail' } } }),
    )
    render(<Checklist />)

    expect(screen.getByRole('region', { name: 'Stepper' }).dataset.variant).toBe('rail')
  })

  it('builds the props of a step from the values of the form', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: [
          STEPS[0],
          {
            ...STEPS[1],
            props: (values: typeof DEFAULT_VALUES) => ({
              description:
                values.contact.name === '' ? 'Your building' : `${values.contact.name}'s building`,
            }),
          },
          STEPS[2],
        ],
      }),
    )
    render(<Checklist />)

    expect(stepItem('Building').dataset.description).toBe('Your building')
    await type('Name', 'Ada')
    expect(stepItem('Building').dataset.description).toBe("Ada's building")
  })

  it('builds no props for a step its condition hides', async () => {
    const buildProps = vi.fn(() => ({ description: 'Your building' }))
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: [
          STEPS[0],
          {
            ...STEPS[1],
            visibleWhen: (values: typeof DEFAULT_VALUES) => values.contact.name !== '',
            props: buildProps,
          },
          STEPS[2],
        ],
      }),
    )
    render(<Checklist />)

    expect(buildProps).not.toHaveBeenCalled()
    await type('Name', 'Ada')
    expect(stepItem('Building').dataset.description).toBe('Your building')
  })

  for (const mode of MODES) {
    it(`keeps a step left invalid incomplete and in the way, with validation mode ${mode}`, async () => {
      const Checklist = createForm(
        BINDING,
        checklistConfig({ schema: strictSchema, validation: { mode } }),
      )
      render(<Checklist />)

      await type('Name', 'Ada')
      await click('Next')
      await click('Next')
      await click('Back')

      expect(stepItem('Building').dataset.complete).toBe('false')
      expect(stepItem('Building').dataset.dueError).toBe('true')
      expect(stepItem('Heating').dataset.reachable).toBe('false')

      await click('Go to Building')
      expect(screen.getByText('Enter a city')).toBeDefined()
    })
  }

  it('checks a step shown again on change, as before it was left, in the default mode', async () => {
    const Checklist = createForm(BINDING, checklistConfig({ schema: strictSchema }))
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await click('Next')
    await click('Back')
    await click('Go to Building')
    expect(screen.getByText('Enter a city')).toBeDefined()

    await type('City', 'Bonn')

    expect(screen.queryByText('Enter a city')).toBeNull()
    expect(stepItem('Building').dataset.complete).toBe('true')
    expect(currentStep()).toBe('Go to Building')
  })

  it('takes the tick from a step emptied after it was shown again, in the default mode', async () => {
    const Checklist = createForm(BINDING, checklistConfig({ schema: strictSchema }))
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await type('City', 'Bonn')
    await click('Next')
    await click('Back')
    await type('City', '')

    expect(stepItem('Building').dataset.complete).toBe('false')
    expect(stepItem('Heating').dataset.reachable).toBe('false')
    expect(currentStep()).toBe('Go to Building')
  })

  it('stays on a step shown again when the recheck of a step shown before it settles first', async () => {
    const holds: (() => void)[][] = [[], []]
    let isHolding = false
    const heldRule = (index: number) => () =>
      isHolding
        ? new Promise<undefined>((resolve) => holds[index]?.push(() => resolve(undefined)))
        : Promise.resolve(undefined)
    const settle = async (index: number): Promise<void> => {
      await act(async () => {
        holds[index]?.shift()?.()
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    }
    const settleRendering = async (): Promise<void> => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
    }
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' }, building: { city: 'Bonn' } },
        fields: {
          ...FIELDS,
          contact: {
            fields: {
              name: { ...FIELDS.contact.fields.name, validators: { onSubmitAsync: heldRule(0) } },
            },
          },
          building: {
            fields: {
              city: { ...FIELDS.building.fields.city, validators: { onSubmitAsync: heldRule(1) } },
            },
          },
        },
      }),
    )
    render(<Checklist />)
    await click('Next')
    await settleRendering()
    await click('Next')
    await settleRendering()

    isHolding = true
    await click('Go to Contact')
    await click('Go to Building')
    await settle(0)
    await settle(1)

    expect(currentStep()).toBe('Go to Building')
  })

  it('keeps a step emptied after its check incomplete once it is left, in a mode checking on change', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({ schema: strictSchema, validation: { mode: 'onChange' } }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await type('City', 'Bonn')
    await click('Next')
    await click('Back')
    await type('City', '')
    await click('Back')

    expect(stepItem('Building').dataset.complete).toBe('false')
    expect(stepItem('Heating').dataset.reachable).toBe('false')
  })

  it('keeps the last step incomplete when a failed submit shows an earlier one', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({ schema: strictSchema, validation: { mode: 'onSubmit' } }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await type('City', 'Bonn')
    await click('Next')
    await click('Back')
    await type('City', '')
    await click('Go to Heating')
    await click('Submit')

    expect(currentStep()).toBe('Go to Building')
    expect(stepItem('Heating').dataset.complete).toBe('false')
    expect(stepItem('Heating').dataset.dueError).toBe('true')
  })

  it('keeps the error of the last step due when only it fails the submit, and completes it once fixed', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({ schema: strictSchema, validation: { mode: 'onChange' } }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await type('City', 'Bonn')
    await click('Next')
    await click('Submit')

    expect(stepItem('Heating').dataset.dueError).toBe('true')
    await type('Kind', 'Gas')
    expect(stepItem('Heating').dataset.complete).toBe('true')
  })

  it('submits once when next or Enter comes again while the submit runs', async () => {
    let settle: () => void = () => undefined
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve
        }),
    )
    const Checklist = createForm(BINDING, checklistConfig({ onSubmit }))
    render(<Checklist />)
    await type('Name', 'Ada')
    await click('Next')
    await click('Next')
    await type('Kind', 'Gas')

    await click('Submit')
    await click('Submit')
    await act(async () => {
      fireEvent.submit(screen.getByLabelText('Kind').closest('form') as HTMLFormElement)
    })
    await act(async () => {
      settle()
    })

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('starts the steps over when onSubmit resets the form', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        onSubmit: ({ formApi }: { formApi: { reset: () => void } }) => formApi.reset(),
      }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Next')
    await click('Next')
    await type('Kind', 'Gas')
    await click('Submit')

    expect(currentStep()).toBe('Go to Contact')
    expect(screen.getByLabelText('Name')).toHaveProperty('value', '')
    for (const label of ['Contact', 'Building', 'Heating']) {
      expect(stepItem(label).dataset.complete).toBe('false')
      expect(stepItem(label).dataset.visited).toBe(String(label === 'Contact'))
    }
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

  it('submits from a step whose submitsWhen holds, and shows no step after it', async () => {
    const onSubmit = vi.fn()
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: z.object({
          contact: z.object({ name: z.string().min(1, 'Enter a name') }),
          building: z.object({ city: z.string() }),
          heating: z.object({ kind: z.string() }),
        }),
        layout: [
          {
            ...STEPS[0],
            submitsWhen: (values: typeof DEFAULT_VALUES) => values.contact.name === 'Ada',
          },
          STEPS[1],
          STEPS[2],
        ],
        onSubmit: ({ value }: { value: unknown }) => onSubmit(value),
      }),
    )
    render(<Checklist />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDefined()

    await type('Name', 'Ada')

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await click('Submit')
    expect(onSubmit).toHaveBeenCalledTimes(1)
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

describe('createForm with steps, errors and focus', () => {
  for (const mode of MODES) {
    it(`shows the errors of a step once it was submitted, with validation mode ${mode}`, async () => {
      const Checklist = createForm(BINDING, checklistConfig({ validation: { mode } }))
      render(<Checklist />)

      expect(screen.queryByText('Enter a name')).toBeNull()
      await click('Next')

      expect(screen.getByText('Enter a name')).toBeDefined()
      expect(screen.getByLabelText('Name')).toHaveProperty('ariaInvalid', 'true')
    })

    it(`shows no error of a step it moves to, with validation mode ${mode}`, async () => {
      const Checklist = createForm(
        BINDING,
        checklistConfig({
          validation: { mode },
          defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
        }),
      )
      render(<Checklist />)

      await click('Next')
      await click('Next')

      expect(currentStep()).toBe('Go to Heating')
      expect(screen.queryByText('Enter a kind')).toBeNull()
    })
  }

  it('focuses the first invalid control of a step it stays on', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.extend({
          contact: z.object({ name: z.string(), email: z.string().min(1, 'Enter an email') }),
        }),
        defaultValues: { ...DEFAULT_VALUES, contact: { name: '', email: '' } },
        fields: {
          ...FIELDS,
          contact: {
            fields: {
              name: { widget: 'text', props: { label: 'Name' } },
              email: { widget: 'text', props: { label: 'Email' } },
            },
          },
        },
      }),
    )
    render(<Checklist />)

    await click('Next')

    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
  })

  it('moves to the first step holding an error when the form fails to submit', async () => {
    const onSubmitInvalid = vi.fn()
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.refine((values) => values.heating.kind !== 'oil', {
          path: ['contact', 'name'],
          message: 'Ada does not heat with oil',
        }),
        defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
        onSubmitInvalid,
      }),
    )
    render(<Checklist />)

    await click('Next')
    await click('Next')
    await type('Kind', 'oil')
    await click('Submit')

    expect(currentStep()).toBe('Go to Contact')
    expect(screen.getByText('Ada does not heat with oil')).toBeDefined()
    expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    expect(onSubmitInvalid).toHaveBeenCalledOnce()
  })

  it('focuses invalid controls in the order they are rendered, a field shown later included', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.extend({
          contact: z.object({
            toggle: z.string(),
            email: z.string().min(1, 'Enter an email'),
            name: z.string().min(1, 'Enter a name'),
          }),
        }),
        defaultValues: { ...DEFAULT_VALUES, contact: { toggle: '', email: '', name: '' } },
        fields: {
          ...FIELDS,
          contact: {
            fields: {
              toggle: { widget: 'text', props: { label: 'Toggle' } },
              email: {
                widget: 'text',
                props: { label: 'Email' },
                visibleWhen: (values: { contact: { toggle: string } }) =>
                  values.contact.toggle === 'y',
              },
              name: { widget: 'text', props: { label: 'Name' } },
            },
          },
        },
      }),
    )
    render(<Checklist />)

    await type('Toggle', 'y')
    await click('Next')

    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
  })

  it('warns when the last step fails to submit only through fields it does not render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
        fields: {
          ...FIELDS,
          heating: {
            fields: {
              kind: { ...FIELDS.heating.fields.kind, visibleWhen: () => false },
            },
          },
        },
      }),
    )
    render(<Checklist />)

    await click('Next')
    await click('Next')
    await click('Submit')

    expect(currentStep()).toBe('Go to Heating')
    expect(warn).toHaveBeenCalledWith(
      'formdef: the step "heating" is held back by errors on fields it does not render: heating.kind. What a condition hides must accept every value it can hold.',
    )
  })

  it('focuses a field of the step when the step itself holds an error too', async () => {
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.extend({
          contact: z
            .object({ name: z.string().min(1, 'Enter a name') })
            .refine(() => false, { message: 'Contact is incomplete' }),
        }),
      }),
    )
    render(<Checklist />)

    await click('Next')

    expect(document.activeElement).toBe(screen.getByLabelText('Name'))
  })

  it('warns when a step is held back only by an error on the step itself', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.extend({
          contact: z
            .object({ name: z.string() })
            .refine(() => false, { message: 'Contact is incomplete' }),
        }),
      }),
    )
    render(<Checklist />)

    await click('Next')

    expect(currentStep()).toBe('Go to Contact')
    expect(warn).toHaveBeenCalledWith(
      'formdef: the step "contact" is held back by an error on the step itself, which no field shows. A rule across the fields of a step puts its path on one of them.',
    )
  })

  it('warns once when a step is held back only by fields it does not render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.extend({
          contact: z.object({ name: z.string(), email: z.string().min(1, 'Enter an email') }),
        }),
        defaultValues: { ...DEFAULT_VALUES, contact: { name: '', email: '' } },
        fields: {
          ...FIELDS,
          contact: {
            fields: {
              name: { widget: 'text', props: { label: 'Name' } },
              email: {
                widget: 'text',
                props: { label: 'Email' },
                visibleWhen: (values: { contact: { name: string } }) => values.contact.name !== '',
              },
            },
          },
        },
      }),
    )
    render(<Checklist />)

    await click('Next')
    await click('Next')

    expect(currentStep()).toBe('Go to Contact')
    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(
      'formdef: the step "contact" is held back by errors on fields it does not render: contact.email. What a condition hides must accept every value it can hold.',
    )
  })

  it('warns when the form fails to submit only through a step its condition hides', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        defaultValues: { ...DEFAULT_VALUES, contact: { name: 'Ada' } },
        layout: [STEPS[0], STEPS[1], { ...STEPS[2], visibleWhen: () => false }],
      }),
    )
    render(<Checklist />)

    await click('Next')
    await click('Submit')

    expect(currentStep()).toBe('Go to Building')
    expect(warn).toHaveBeenCalledWith(
      'formdef: the form fails to submit through errors in the hidden step "heating": heating.kind. What a condition hides must accept every value it can hold.',
    )
  })

  it('warns when a step left out by submitsWhen holds the errors that stop the submit', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        layout: [{ ...STEPS[0], submitsWhen: () => true }, { ...STEPS[1] }, { ...STEPS[2] }],
      }),
    )
    render(<Checklist />)

    await type('Name', 'Ada')
    await click('Submit')

    expect(warn).toHaveBeenCalledWith(
      'formdef: the form fails to submit through errors in the hidden step "heating": heating.kind. What a condition hides must accept every value it can hold.',
    )
  })

  it('warns once when a step key starts another root key, whose fields its group would count', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Checklist = createForm(
      BINDING,
      checklistConfig({
        schema: schema.extend({ contactExtra: z.object({ note: z.string() }) }),
        defaultValues: { ...DEFAULT_VALUES, contactExtra: { note: '' } },
        fields: {
          ...FIELDS,
          contactExtra: { fields: { note: { widget: 'text', props: { label: 'Note' } } } },
        },
        layout: [...STEPS, { step: 'contactExtra', label: 'Extra' }],
      }),
    )
    render(<Checklist />)
    render(<Checklist />)

    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(
      'formdef: the step "contact" starts the root key "contactExtra"; its form group would count the fields of "contactExtra" as its own.',
    )
  })
})
