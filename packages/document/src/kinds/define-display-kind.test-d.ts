import {
  type ArrayFrameProps,
  createRegistry,
  type SectionProps,
  type StepperProps,
} from '@formdef/core'
import { describe, expectTypeOf, it } from 'vitest'

import { defineDisplayKind } from './define-display-kind'
import { setting } from './setting'

const Stepper = (
  _: StepperProps<{ icon?: 'house' | 'flame' }> & { variant?: 'circles' | 'rail' },
) => null
const Section = (_: SectionProps & { variant?: 'legend' | 'card' }) => null

const registry = createRegistry({
  widgets: {},
  structure: { stepper: Stepper, section: Section },
})

describe('defineDisplayKind', () => {
  it("gives the form's display the stepper's own props", () => {
    defineDisplayKind(registry, {
      name: 'rail',
      label: 'Rail',
      appliesTo: 'form',
      props: () => ({ variant: 'rail' }),
    })
    defineDisplayKind(registry, {
      name: 'bar',
      label: 'Bar',
      appliesTo: 'form',
      // @ts-expect-error the stepper's variant is 'circles' or 'rail'
      props: () => ({ variant: 'bar' }),
    })
  })

  it('gives a step what the stepper shows per step', () => {
    defineDisplayKind(registry, {
      name: 'heating',
      label: 'Heating icon',
      appliesTo: 'step',
      props: () => ({ icon: 'flame' }),
    })
    defineDisplayKind(registry, {
      name: 'label',
      label: 'Label',
      appliesTo: 'step',
      // @ts-expect-error a step's label is the step's own, not a display's
      props: () => ({ label: 'Heating' }),
    })
  })

  it("passes the settings to props, which the section's props check", () => {
    defineDisplayKind(registry, {
      name: 'card',
      label: 'Card',
      appliesTo: 'section',
      settings: { isCard: setting.boolean({ label: 'As a card' }) },
      props: (settings) => {
        expectTypeOf(settings).toEqualTypeOf<{ isCard: boolean | undefined }>()
        return { variant: settings.isCard === true ? 'card' : 'legend' }
      },
    })
  })

  it('takes no props for a slot the registry does not hold', () => {
    defineDisplayKind(registry, {
      name: 'wide',
      label: 'Wide',
      appliesTo: 'row',
      // @ts-expect-error the registry has no row slot
      props: () => ({ className: 'gap-8' }),
    })
  })

  it("gives a repeat's display the array frame's own props", () => {
    const ArrayFrame = (_: ArrayFrameProps<unknown> & { variant?: 'list' | 'cards' }) => null
    const withFrame = registry.extendRegistry({ structure: { arrayFrame: ArrayFrame } })
    defineDisplayKind(withFrame, {
      name: 'cards',
      label: 'Cards',
      appliesTo: 'repeat',
      props: () => ({ variant: 'cards' }),
    })
    defineDisplayKind(withFrame, {
      name: 'table',
      label: 'Table',
      appliesTo: 'repeat',
      // @ts-expect-error the array frame has no variant `table`
      props: () => ({ variant: 'table' }),
    })
  })

  it('rejects a formatted text setting', () => {
    defineDisplayKind(registry, {
      name: 'note',
      label: 'Note',
      appliesTo: 'section',
      // @ts-expect-error a display's settings are no formatted text
      settings: { note: setting.text({ label: 'Note', formatted: true }) },
    })
  })
})
