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

  it('takes no props', () => {
    // @ts-expect-error a step carries no props for the stepper
    const entry: Step = { step: 'contact', label: 'Contact', props: { icon: 'user' } }
    expectTypeOf(entry).not.toBeAny()
  })

  it('needs a registered stepper', () => {
    // @ts-expect-error without a stepper slot nothing renders the steps
    const entry: StepWithoutStepper = { step: 'contact', label: 'Contact' }
    expectTypeOf(entry).not.toBeAny()
  })
})
