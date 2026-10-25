import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { SwitchField } from '@/components/formdef/switch-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { switch: SwitchField },
})

const schema = z.object({ alerts: z.boolean().refine((enabled) => enabled, 'Alerts are required') })

const formWith = (variant: 'split' | 'list' | 'card') =>
  createForm({
    schema,
    defaultValues: { alerts: false },
    formId: 'settings',
    validation: { mode: 'onSubmit' },
    fields: {
      alerts: {
        widget: 'switch',
        props: { label: 'Alerts', description: 'By email', className: 'ms-2', variant },
      },
    },
  })

const alerts = (): HTMLElement => screen.getByRole('switch', { name: 'Alerts' })

afterEach(cleanup)

describeWiring({
  Form: formWith('split'),
  control: alerts,
  id: 'settings-alerts',
  description: 'By email',
  error: 'Alerts are required',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('SwitchField', () => {
  it('writes its state to the form when clicked', () => {
    const Form = formWith('split')
    render(<Form />)

    fireEvent.click(alerts())

    expect(alerts().getAttribute('aria-checked')).toBe('true')
  })

  it('puts the class name on the switch', () => {
    const Form = formWith('split')
    render(<Form />)

    expect(alerts().classList).toContain('ms-2')
  })

  it.each(['split', 'list', 'card'] as const)('is named by its label alone as a %s', (variant) => {
    const Form = formWith(variant)
    render(<Form />)

    expect(alerts()).toBeDefined()
  })

  it('makes the whole card its label', () => {
    const Form = formWith('card')
    const { container } = render(<Form />)
    expect(container.querySelector('label')?.contains(alerts())).toBe(true)
  })
})
