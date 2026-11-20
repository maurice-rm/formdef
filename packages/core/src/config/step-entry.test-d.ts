import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { StepEntry } from './step-entry'
import type { StepperProps } from './structure'

type Values = {
  contact: { name: string }
  building: { rooms: number } | undefined
  email: string
  tags: string[]
}

type Parts<TStructure> = {
  widgets: Record<never, never>
  structure: TStructure
  formComponents: Record<never, never>
  handle: unknown
}

type Step = StepEntry<Parts<{ stepper: ComponentType<StepperProps> }>, Values>
type StepWithoutStepper = StepEntry<Parts<Record<never, never>>, Values>
type StepWithDescription = StepEntry<
  Parts<{ stepper: ComponentType<StepperProps<{ description?: string }>> }>,
  Values
>
type StepWithIcon = StepEntry<
  Parts<{ stepper: ComponentType<StepperProps<{ icon: string; description?: string }>> }>,
  Values
>

describe('StepEntry', () => {
  it('names an object key of the root level and a label', () => {
    const entry: Step = { step: 'contact', label: 'Contact' }
    expectTypeOf(entry).not.toBeAny()
  })

  it('names an optional object key', () => {
    const entry: Step = { step: 'building', label: 'Building' }
    expectTypeOf(entry).not.toBeAny()
  })

  it('rejects a key whose value is not an object', () => {
    // @ts-expect-error `email` holds a string, a step renders an object level
    const entry: Step = { step: 'email', label: 'Email' }
    expectTypeOf(entry).not.toBeAny()
  })

  it('rejects a key whose value is an array', () => {
    // @ts-expect-error `tags` holds an array, a step renders an object level
    const entry: Step = { step: 'tags', label: 'Tags' }
    expectTypeOf(entry).not.toBeAny()
  })

  it('requires a label', () => {
    // @ts-expect-error the stepper shows each step by its label
    const entry: Step = { step: 'contact' }
    expectTypeOf(entry).not.toBeAny()
  })

  it('is visible by a condition on the values of the whole form', () => {
    const entry: Step = {
      step: 'building',
      label: 'Building',
      visibleWhen: (values) => {
        expectTypeOf(values).toEqualTypeOf<Values>()
        return values.contact.name !== ''
      },
      dependsOn: ['contact.name'],
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('submits by a condition on the values of the whole form', () => {
    const entry: Step = {
      step: 'contact',
      label: 'Contact',
      submitsWhen: (values) => {
        expectTypeOf(values).toEqualTypeOf<Values>()
        return values.email.endsWith('.test')
      },
    }
    // @ts-expect-error submitsWhen returns whether the step submits
    const wrong: Step = { step: 'contact', label: 'Contact', submitsWhen: () => 'yes' }
    expectTypeOf(entry).not.toBeAny()
    expectTypeOf(wrong).not.toBeAny()
  })

  it('takes no props when the stepper declares none per step', () => {
    // @ts-expect-error the registered stepper reads nothing per step beyond its state
    const entry: Step = { step: 'contact', label: 'Contact', props: { icon: 'user' } }
    expectTypeOf(entry).not.toBeAny()
  })

  it('takes the props the stepper declares per step, optional when every one is', () => {
    const plain: StepWithDescription = { step: 'contact', label: 'Contact' }
    const described: StepWithDescription = {
      step: 'contact',
      label: 'Contact',
      props: { description: 'How we reach you' },
    }
    expectTypeOf(plain).not.toBeAny()
    expectTypeOf(described).not.toBeAny()
  })

  it('requires props when the stepper declares one it needs', () => {
    // @ts-expect-error the stepper needs an icon for each step
    const entry: StepWithIcon = { step: 'contact', label: 'Contact' }
    const withIcon: StepWithIcon = { step: 'contact', label: 'Contact', props: { icon: 'user' } }
    expectTypeOf(entry).not.toBeAny()
    expectTypeOf(withIcon).not.toBeAny()
  })

  it('rejects a prop the stepper does not declare', () => {
    const entry: StepWithDescription = {
      step: 'contact',
      label: 'Contact',
      // @ts-expect-error the stepper reads a description per step, nothing else
      props: { icon: 'user' },
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('builds props from the values of the whole form', () => {
    const entry: StepWithDescription = {
      step: 'contact',
      label: 'Contact',
      props: (values) => {
        expectTypeOf(values).toEqualTypeOf<Values>()
        return { description: values.contact.name }
      },
    }
    expectTypeOf(entry).not.toBeAny()
  })

  it('needs a registered stepper', () => {
    // @ts-expect-error without a stepper slot nothing renders the steps
    const entry: StepWithoutStepper = { step: 'contact', label: 'Contact' }
    expectTypeOf(entry).not.toBeAny()
  })
})
